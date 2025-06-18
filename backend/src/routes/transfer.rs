use {
    crate::{
        errors::AppError,
        models::{MultiTransactionResponse, TransferCbRequest},
        routes::util::parse_latest_blockhash,
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode,
    solana_sdk::{
        instruction::Instruction,
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
                account_info::TransferAccountInfo, instruction::transfer,
                ConfidentialTransferAccount,
            },
            BaseStateWithExtensions, StateWithExtensionsOwned,
        },
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair},
    },
    spl_token_confidential_transfer_proof_extraction::instruction::{
        zk_proof_type_to_instruction, ProofLocation,
    },
    spl_token_confidential_transfer_proof_generation::transfer::TransferProofData,
    std::mem::size_of,
};

/// Handler for the transfer-cb endpoint
///
/// This endpoint creates a transaction to transfer tokens between confidential token accounts
pub async fn transfer_cb(
    Json(request): Json<TransferCbRequest>,
) -> Result<Json<MultiTransactionResponse>, AppError> {
    println!("📝 Processing transfer-cb request");

    // Decode amount from request
    println!("📦 Decoding amount from request");
    let transfer_amount_lamports = request
        .amount
        .parse::<u64>()
        .map_err(|_| AppError::InvalidAmount)?;
    println!(
        "✅ Successfully decoded amount: {}",
        transfer_amount_lamports
    );

    // Parse rent values for proof account creation
    let equality_proof_rent = request
        .equality_proof_rent
        .parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let ciphertext_validity_proof_rent = request
        .ciphertext_validity_proof_rent
        .parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let range_proof_rent = request
        .range_proof_rent
        .parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;

    // Decode sender token account data from request
    println!("📦 Decoding sender token account data from request");
    let sender_token_account_info = {
        let sender_token_account_data = BASE64_STANDARD.decode(&request.sender_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(
            sender_token_account_data,
        )?
    };
    println!(
        "✅ Successfully decoded sender token account data from owner {}",
        sender_token_account_info.base.owner.to_string()
    );

    // Decode recipient token account data from request
    println!("📦 Decoding recipient token account data from request");
    let recipient_token_account_info = {
        let recipient_token_account_data =
            BASE64_STANDARD.decode(&request.recipient_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(
            recipient_token_account_data,
        )?
    };
    println!(
        "✅ Successfully decoded recipient token account data from owner {}",
        recipient_token_account_info.base.owner.to_string()
    );

    // Verify that both accounts reference the same mint
    let mint = {
        let sender_mint = sender_token_account_info.base.mint;
        let recipient_mint = recipient_token_account_info.base.mint;

        if sender_token_account_info.base.mint != recipient_token_account_info.base.mint {
            println!(
                "⛔️ Mint mismatch: sender mint {} does not match recipient mint {}",
                sender_mint.to_string(),
                recipient_mint.to_string()
            );
            return Err(AppError::MintMismatch);
        }

        sender_mint
    };

    // Get the sender token account pubkey
    let sender_ata_authority = sender_token_account_info.base.owner;
    let sender_token_account = get_associated_token_address_with_program_id(
        &sender_ata_authority,
        &mint,
        &spl_token_2022::id(),
    );
    println!(
        "✅ Calculated sender token account address: {}",
        sender_token_account
    );

    // Get the recipient token account address
    let recipient_ata_authority = recipient_token_account_info.base.owner;
    let recipient_token_account = get_associated_token_address_with_program_id(
        &recipient_ata_authority,
        &mint,
        &spl_token_2022::id(),
    );
    println!(
        "✅ Calculated recipient token account address: {}",
        recipient_token_account
    );

    // Must first create 3 accounts to store proofs before transferring tokens
    // This must be done in a separate transactions because the proofs are too large for single transaction:
    // Equality Proof - prove that two ciphertexts encrypt the same value
    // Ciphertext Validity Proof - prove that ciphertexts are properly generated
    // Range Proof - prove that ciphertexts encrypt a value in a specified range (0, u64::MAX)

    // "Authority" for the proof accounts (to close the accounts after the transfer)
    let context_state_authority = &sender_ata_authority;

    // Generate addresses for proof accounts
    let equality_proof_context_state_account = Keypair::new();
    let ciphertext_validity_proof_context_state_account = Keypair::new();
    let range_proof_context_state_account = Keypair::new();

    // ConfidentialTransferAccount extension information needed to create proof data
    let sender_transfer_account_info = {
        let sender_account_extension_data =
            sender_token_account_info.get_extension::<ConfidentialTransferAccount>()?;

        TransferAccountInfo::new(sender_account_extension_data)
    };

    let recipient_elgamal_pubkey: solana_zk_sdk::encryption::elgamal::ElGamalPubkey =
        recipient_token_account_info
            .get_extension::<ConfidentialTransferAccount>()?
            .elgamal_pubkey
            .try_into()?;

    // Get auditor ElGamal pubkey from the mint account data
    let auditor_elgamal_pubkey_option = {
        let mint_account_data = BASE64_STANDARD.decode(&request.mint_token_account)?;

        Option::<solana_zk_sdk::encryption::pod::elgamal::PodElGamalPubkey>::from(
            StateWithExtensionsOwned::<spl_token_2022::state::Mint>::unpack(mint_account_data)?
                .get_extension::<spl_token_2022::extension::confidential_transfer::ConfidentialTransferMint>()?
                .auditor_elgamal_pubkey,
        )
        .map(|pod| pod.try_into())
        .transpose()?
    };

    // Create the ElGamal keypair and AES key for the sender token account
    // Create the sender's ElGamal keypair in a temporary scope
    let sender_elgamal_keypair = {
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
    let sender_aes_key = {
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

    // Generate proof data
    let TransferProofData {
        equality_proof_data,
        ciphertext_validity_proof_data_with_ciphertext,
        range_proof_data,
    } = sender_transfer_account_info.generate_split_transfer_proof_data(
        transfer_amount_lamports,
        &sender_elgamal_keypair,
        &sender_aes_key,
        &recipient_elgamal_pubkey,
        auditor_elgamal_pubkey_option.as_ref(),
    )?;

    // Create 3 proofs ------------------------------------------------------

    // Range Proof Instructions------------------------------------------------------------------------------
    let (range_create_ix, range_verify_ix) =
        get_zk_proof_context_state_account_creation_instructions(
            &sender_ata_authority,
            &range_proof_context_state_account.pubkey(),
            &context_state_authority,
            &range_proof_data,
            range_proof_rent,
        )?;

    // Equality Proof Instructions---------------------------------------------------------------------------
    let (equality_create_ix, equality_verify_ix) =
        get_zk_proof_context_state_account_creation_instructions(
            &sender_ata_authority,
            &equality_proof_context_state_account.pubkey(),
            &context_state_authority,
            &equality_proof_data,
            equality_proof_rent,
        )?;

    // Ciphertext Validity Proof Instructions ----------------------------------------------------------------
    let (cv_create_ix, cv_verify_ix) = get_zk_proof_context_state_account_creation_instructions(
        &sender_ata_authority,
        &ciphertext_validity_proof_context_state_account.pubkey(),
        &context_state_authority,
        &ciphertext_validity_proof_data_with_ciphertext.proof_data,
        ciphertext_validity_proof_rent,
    )?;

    // Transact Proofs ------------------------------------------------------------------------------------
    let client_blockhash = parse_latest_blockhash(&request.latest_blockhash)?;

    // Parse priority fee
    let priority_fee = match request.priority_fee.parse::<u64>() {
        Ok(fee) => fee,
        Err(_) => {
            println!(
                "⚠️ Invalid priority fee format: {}, defaulting to 0",
                request.priority_fee
            );
            0
        }
    };

    // Transaction 1: Allocate all proof accounts at once.
    let tx1 = {
        // Create instructions vector
        let mut instructions = Vec::new();

        // Add priority fee instructions if the fee is greater than 0
        if priority_fee > 0 {
            // Convert lamports to micro-lamports per compute unit
            // For example, 10,000,000 lamports with 200,000 compute units = 50,000 micro-lamports per CU
            let micro_lamports = priority_fee * 1_000_000 / 200_000;

            // Add compute budget program instructions
            let compute_budget_program_id = solana_sdk::compute_budget::id();

            // Set compute unit limit (optional but recommended)
            instructions.push(solana_sdk::instruction::Instruction::new_with_borsh(
                compute_budget_program_id,
                &solana_sdk::compute_budget::ComputeBudgetInstruction::SetComputeUnitLimit(200_000),
                vec![],
            ));

            // Set compute unit price (priority fee)
            instructions.push(solana_sdk::instruction::Instruction::new_with_borsh(
                compute_budget_program_id,
                &solana_sdk::compute_budget::ComputeBudgetInstruction::SetComputeUnitPrice(
                    micro_lamports,
                ),
                vec![],
            ));
        }

        // Add the original instructions
        instructions.push(range_create_ix.clone());
        instructions.push(equality_create_ix.clone());
        instructions.push(cv_create_ix.clone());

        // Rest of the code remains the same...
        let message =
            v0::Message::try_compile(&sender_ata_authority, &instructions, &[], client_blockhash)?;

        // Create a versioned message
        let versioned_message = VersionedMessage::V0(message.clone());

        VersionedTransaction::try_new(
            versioned_message,
            &[
                &NullSigner::new(&sender_ata_authority) as &dyn Signer,
                &range_proof_context_state_account,
                &equality_proof_context_state_account,
                &ciphertext_validity_proof_context_state_account,
            ],
        )?
    };

    // Transaction 2: Encode Range Proof on its own (because it's the largest).
    let tx2 = {
        let message = v0::Message::try_compile(
            &sender_ata_authority,
            &[range_verify_ix],
            &[],
            client_blockhash,
        )?;

        // Create a versioned transaction with a placeholder signature for the sender
        VersionedTransaction {
            // Single placeholder signature for the sender as the fee payer.
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    // Transaction 3: Encode all remaining proofs.
    let tx3 = {
        let message = v0::Message::try_compile(
            &sender_ata_authority,
            &[equality_verify_ix, cv_verify_ix],
            &[],
            client_blockhash,
        )?;

        // Create a versioned transaction with a placeholder signature for the sender
        VersionedTransaction {
            // Single placeholder signature for the sender
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    // Transaction 4: Execute transfer (below)
    // Transfer with Split Proofs -------------------------------------------
    let tx4 = {
        let new_decryptable_available_balance = sender_transfer_account_info
            .new_decryptable_available_balance(transfer_amount_lamports, &sender_aes_key)
            .map_err(|_| TokenError::AccountDecryption)?
            .into();

        let instructions = transfer(
            &spl_token_2022::id(),
            &sender_token_account,
            &mint,
            &recipient_token_account,
            &new_decryptable_available_balance,
            &ciphertext_validity_proof_data_with_ciphertext.ciphertext_lo,
            &ciphertext_validity_proof_data_with_ciphertext.ciphertext_hi,
            &sender_ata_authority,
            &vec![],
            ProofLocation::ContextStateAccount(&equality_proof_context_state_account.pubkey()),
            ProofLocation::ContextStateAccount(
                &ciphertext_validity_proof_context_state_account.pubkey(),
            ),
            ProofLocation::ContextStateAccount(&range_proof_context_state_account.pubkey()),
        )?;

        let message =
            v0::Message::try_compile(&sender_ata_authority, &instructions, &[], client_blockhash)?;

        // Create a versioned transaction with a placeholder signature for the sender
        VersionedTransaction {
            // Single placeholder signature for the sender
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    // Transaction 5: (below)
    // Close Proof Accounts --------------------------------------------------
    let tx5 = {
        // Lamports from the closed proof accounts will be sent to this account
        let destination_account = &sender_ata_authority;

        // Close the equality proof account
        let close_equality_proof_instruction = close_context_state(
            ContextStateInfo {
                context_state_account: &equality_proof_context_state_account.pubkey(),
                context_state_authority: &context_state_authority,
            },
            &destination_account,
        );

        // Close the ciphertext validity proof account
        let close_ciphertext_validity_proof_instruction = close_context_state(
            ContextStateInfo {
                context_state_account: &ciphertext_validity_proof_context_state_account.pubkey(),
                context_state_authority: &context_state_authority,
            },
            &destination_account,
        );

        // Close the range proof account
        let close_range_proof_instruction = close_context_state(
            ContextStateInfo {
                context_state_account: &range_proof_context_state_account.pubkey(),
                context_state_authority: &context_state_authority,
            },
            &destination_account,
        );

        let message = v0::Message::try_compile(
            &sender_ata_authority,
            &[
                close_equality_proof_instruction,
                close_ciphertext_validity_proof_instruction,
                close_range_proof_instruction,
            ],
            &[],
            client_blockhash,
        )?;

        // Create a versioned transaction with a placeholder signature for the sender
        VersionedTransaction {
            // Single placeholder signature for the sender
            signatures: vec![Signature::default()],
            message: VersionedMessage::V0(message),
        }
    };

    // Return all transactions
    let transactions = vec![tx1, tx2, tx3, tx4, tx5];
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
) -> Result<(Instruction, Instruction), AppError> {
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
