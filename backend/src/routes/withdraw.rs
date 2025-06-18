use {
    crate::{
        errors::AppError,
        models::{MultiTransactionResponse, WithdrawCbRequest},
        routes::util::parse_latest_blockhash,
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode,
    solana_sdk::{
        message::{v0, VersionedMessage},
        pubkey::Pubkey,
        signature::{Keypair, NullSigner, Signature},
        signer::Signer,
        system_instruction,
        transaction::VersionedTransaction,
    },
    solana_zk_sdk::zk_elgamal_proof_program::{
        instruction::{close_context_state, ContextStateInfo},
        proof_data::ZkProofData,
        state::ProofContextState,
    },
    spl_associated_token_account::get_associated_token_address_with_program_id,
    spl_token_2022::{
        error::TokenError,
        extension::{
            confidential_transfer::{
                account_info::WithdrawAccountInfo, instruction::withdraw,
                ConfidentialTransferAccount,
            },
            BaseStateWithExtensions, StateWithExtensionsOwned,
        },
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair},
    },
    spl_token_confidential_transfer_proof_extraction::instruction::ProofLocation,
    spl_token_confidential_transfer_proof_generation::withdraw::WithdrawProofData,
    std::str::FromStr,
};

/// Handler for the withdraw-cb endpoint
///
/// This endpoint creates a transaction to withdraw tokens from a confidential token account
pub async fn withdraw_cb(
    Json(request): Json<WithdrawCbRequest>,
) -> Result<Json<MultiTransactionResponse>, AppError> {
    println!("📝 Processing withdraw-cb request");

    // Decode recipient token account info
    let recipient_token_account_info = {
        let recipient_token_account_data =
            BASE64_STANDARD.decode(&request.recipient_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(
            recipient_token_account_data,
        )?
    };

    // Parse rent values for proof account creation
    let equality_proof_rent = request
        .equality_proof_rent
        .parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let range_proof_rent = request
        .range_proof_rent
        .parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;

    // Decode mint account info
    let mint_account_info = {
        let mint_account_data = BASE64_STANDARD.decode(&request.mint_account_info)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Mint>::unpack(mint_account_data)?
    };

    // Decode client blockhash
    let client_blockhash = parse_latest_blockhash(&request.latest_blockhash)?;

    // Decode withdraw amount
    let withdraw_amount = u64::from_str(&request.withdraw_amount_lamports)
        .map_err(|_| AppError::SerializationError)?;

    // Create the ElGamal keypair and AES key for the sender token account
    // Create the sender's ElGamal keypair in a temporary scope
    let receiver_elgamal_keypair = {
        println!(
            "🔐 Decoding ElGamal signature: {}",
            request.elgamal_signature
        );
        let decoded_elgamal_signature = BASE64_STANDARD.decode(&request.elgamal_signature)?;
        println!(
            "✅ ElGamal signature base64 decoded, got {} bytes",
            decoded_elgamal_signature.len()
        );

        // Create signature directly from bytes
        let elgamal_signature = Signature::try_from(decoded_elgamal_signature.as_slice())
            .map_err(|_| AppError::SerializationError)?;
        println!("✅ ElGamal signature created successfully");

        ElGamalKeypair::new_from_signature(&elgamal_signature)
            .map_err(|_| AppError::SerializationError)?
    };
    println!("✅ ElGamal keypair created successfully");

    // Create the sender's AES key in a temporary scope
    let receiver_aes_key = {
        println!("🔐 Decoding AES signature: {}", request.aes_signature);
        let decoded_aes_signature = BASE64_STANDARD.decode(&request.aes_signature)?;
        println!(
            "✅ AES signature base64 decoded, got {} bytes",
            decoded_aes_signature.len()
        );

        // Create signature directly from bytes
        let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
            .map_err(|_| AppError::SerializationError)?;
        println!("✅ AES signature created successfully");

        AeKey::new_from_signature(&aes_signature).map_err(|_| AppError::SerializationError)?
    };
    println!("✅ AES key created successfully");

    // Unpack the ConfidentialTransferAccount extension portion of the token account data
    let extension_data =
        recipient_token_account_info.get_extension::<ConfidentialTransferAccount>()?;

    // Confidential Transfer extension information needed to construct a `Withdraw` instruction.
    let withdraw_account_info = WithdrawAccountInfo::new(extension_data);

    // Authority for the withdraw proof account (to close the account)
    let context_state_authority = &recipient_token_account_info.base.owner;

    // Create a withdraw proof data
    let WithdrawProofData {
        equality_proof_data,
        range_proof_data,
    } = withdraw_account_info.generate_proof_data(
        withdraw_amount,
        &receiver_elgamal_keypair,
        &receiver_aes_key,
    )?;

    let equality_proof_context_state_keypair = Keypair::new();
    let range_proof_context_state_keypair = Keypair::new();

    // Range Proof Instructions------------------------------------------------------------------------------
    let (range_create_ix, range_verify_ix) =
        get_zk_proof_context_state_account_creation_instructions(
            &context_state_authority,
            &range_proof_context_state_keypair.pubkey(),
            &context_state_authority,
            &range_proof_data,
            range_proof_rent,
        )?;

    // Equality Proof Instructions---------------------------------------------------------------------------
    let (equality_create_ix, equality_verify_ix) =
        get_zk_proof_context_state_account_creation_instructions(
            &context_state_authority,
            &equality_proof_context_state_keypair.pubkey(),
            &context_state_authority,
            &equality_proof_data,
            equality_proof_rent,
        )?;

    let tx1 = {
        let message = v0::Message::try_compile(
            &context_state_authority,
            &[equality_create_ix, equality_verify_ix, range_create_ix],
            &[],
            client_blockhash,
        )?;

        let versioned_message = VersionedMessage::V0(message.clone());
        VersionedTransaction::try_new(
            versioned_message,
            &[
                &NullSigner::new(&context_state_authority) as &dyn Signer,
                &range_proof_context_state_keypair,
                &equality_proof_context_state_keypair,
            ],
        )?
    };

    let tx2 = {
        let message = v0::Message::try_compile(
            &context_state_authority,
            &[range_verify_ix],
            &[],
            client_blockhash,
        )?;

        let versioned_message = VersionedMessage::V0(message.clone());
        VersionedTransaction::try_new(
            versioned_message,
            &[&NullSigner::new(&context_state_authority) as &dyn Signer],
        )?
    };

    let tx3 = {
        let new_decryptable_available_balance = withdraw_account_info
            .new_decryptable_available_balance(withdraw_amount, &receiver_aes_key)
            .map_err(|_| TokenError::AccountDecryption)?
            .into();

        let recipient_token_account = get_associated_token_address_with_program_id(
            &recipient_token_account_info.base.owner,
            &recipient_token_account_info.base.mint,
            &spl_token_2022::id(),
        );

        let instructions = withdraw(
            &spl_token_2022::id(),
            &recipient_token_account,
            &recipient_token_account_info.base.mint,
            withdraw_amount,
            mint_account_info.base.decimals,
            &new_decryptable_available_balance,
            &recipient_token_account_info.base.owner,
            &vec![],
            ProofLocation::ContextStateAccount(&equality_proof_context_state_keypair.pubkey()),
            ProofLocation::ContextStateAccount(&range_proof_context_state_keypair.pubkey()),
        )?;

        let message = v0::Message::try_compile(
            &recipient_token_account_info.base.owner,
            &instructions,
            &[],
            client_blockhash,
        )?;

        VersionedTransaction {
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    let tx4 = {
        // Lamports from the closed proof accounts will be sent to this account
        let destination_account = &context_state_authority;

        // Close the equality proof account
        let close_equality_proof_instruction = close_context_state(
            ContextStateInfo {
                context_state_account: &equality_proof_context_state_keypair.pubkey(),
                context_state_authority: &context_state_authority,
            },
            &destination_account,
        );

        // Close the range proof account
        let close_range_proof_instruction = close_context_state(
            ContextStateInfo {
                context_state_account: &range_proof_context_state_keypair.pubkey(),
                context_state_authority: &context_state_authority,
            },
            &destination_account,
        );

        let message = v0::Message::try_compile(
            &context_state_authority,
            &[
                close_equality_proof_instruction,
                close_range_proof_instruction,
            ],
            &[],
            client_blockhash,
        )?;

        VersionedTransaction {
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    // Return all transactions
    let transactions = vec![tx1, tx2, tx3, tx4];
    let response = MultiTransactionResponse {
        transactions: transactions
            .into_iter()
            .enumerate()
            .map(|(i, tx)| {
                let serialized_transaction = match bincode::serialize(&tx) {
                    Ok(bytes) => BASE64_STANDARD.encode(bytes),
                    Err(_) => return Err(AppError::SerializationError),
                };
                println!("✅ Successfully serialized transaction {}", i + 1);

                Ok(serialized_transaction)
            })
            .collect::<Result<Vec<String>, AppError>>()?,
        message: "MultiTransaction for confidential transfer created successfully".to_string(),
    };

    Ok(Json(response))
}

/// Refactored version of spl_token_client::token::Token::confidential_transfer_create_context_state_account().
/// Instead of sending transactions internally or calculating rent via RPC, this function now accepts
/// the rent value from the caller and returns the instructions to be used externally.
fn get_zk_proof_context_state_account_creation_instructions<
    ZK: bytemuck::Pod + ZkProofData<U>,
    U: bytemuck::Pod,
>(
    fee_payer_pubkey: &Pubkey,
    context_state_account_pubkey: &Pubkey,
    context_state_authority_pubkey: &Pubkey,
    proof_data: &ZK,
    rent: u64,
) -> Result<
    (
        solana_sdk::instruction::Instruction,
        solana_sdk::instruction::Instruction,
    ),
    AppError,
> {
    use spl_token_confidential_transfer_proof_extraction::instruction::zk_proof_type_to_instruction;
    use std::mem::size_of;

    let space = size_of::<ProofContextState<U>>();
    println!("📊 Context state account space required: {} bytes", space);
    println!(
        "💰 Using provided rent for context state account: {} lamports",
        rent
    );

    let context_state_info = ContextStateInfo {
        context_state_account: context_state_account_pubkey,
        context_state_authority: context_state_authority_pubkey,
    };

    let instruction_type = zk_proof_type_to_instruction(ZK::PROOF_TYPE)?;

    println!("🔧 Creating context state account with inputs: fee_payer={}, context_state_account={}, rent={}, space={}",
        fee_payer_pubkey, context_state_account_pubkey, rent, space);
    let create_account_ix = system_instruction::create_account(
        fee_payer_pubkey,
        context_state_account_pubkey,
        rent,
        space as u64,
        &solana_zk_sdk::zk_elgamal_proof_program::id(),
    );

    let verify_proof_ix =
        instruction_type.encode_verify_proof(Some(context_state_info), proof_data);

    // Return a tuple containing the create account instruction and verify proof instruction.
    Ok((create_account_ix, verify_proof_ix))
}
