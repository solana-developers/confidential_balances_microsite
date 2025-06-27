use {
    crate::{
        errors::AppError,
        models::{ApplyCbRequest, TransactionResponse},
        routes::util::{parse_base64_base58_pubkey, parse_latest_blockhash},
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode,
    solana_sdk::{
        message::{v0, VersionedMessage},
        signature::Signature,
        transaction::VersionedTransaction,
    },
    spl_associated_token_account::get_associated_token_address_with_program_id,
    spl_token_2022::{
        error::TokenError,
        extension::{
            confidential_transfer::{
                account_info::ApplyPendingBalanceAccountInfo, instruction::apply_pending_balance,
                ConfidentialTransferAccount,
            },
            BaseStateWithExtensions, StateWithExtensionsOwned,
        },
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair},
    },
};

/// Handler to apply pending amount of token to confidential balance
pub async fn apply_cb(
    Json(request): Json<ApplyCbRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🔄 Processing apply_cb request");

    // Parse the authority address
    let ata_authority = parse_base64_base58_pubkey(&request.ata_authority)?;
    println!("✅ Parsed authority pubkey: {}", ata_authority);

    // Deserialize the account data
    println!("📦 Decoding token account data from request");
    let token_account_info = {
        // Decode token account data from request instead of fetching it
        let token_account_data = BASE64_STANDARD.decode(&request.token_account_data)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(token_account_data)?
    };
    println!(
        "✅ Successfully decoded ATA data from owner {}",
        token_account_info.base.owner.to_string()
    );

    // Parse the mint address
    let mint_pubkey = token_account_info.base.mint;

    // Parse ElGamal signature
    println!(
        "🔐 Decoding ElGamal signature: {}",
        request.elgamal_signature
    );
    let decoded_elgamal_signature = BASE64_STANDARD.decode(&request.elgamal_signature)?;
    let elgamal_signature = Signature::try_from(decoded_elgamal_signature.as_slice())
        .map_err(|_| AppError::SerializationError)?;

    let elgamal_keypair = ElGamalKeypair::new_from_signature(&elgamal_signature)
        .map_err(|_| AppError::SerializationError)?;

    // Parse AES signature
    println!("🔐 Decoding AES signature: {}", request.aes_signature);
    let decoded_aes_signature = BASE64_STANDARD.decode(&request.aes_signature)?;
    let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
        .map_err(|_| AppError::SerializationError)?;

    let aes_key =
        AeKey::new_from_signature(&aes_signature).map_err(|_| AppError::SerializationError)?;

    // Get the associated token account address
    let ata = get_associated_token_address_with_program_id(
        &ata_authority,
        &mint_pubkey,
        &spl_token_2022::id(),
    );
    println!("✅ Calculated ATA address: {}", ata);

    // Unpack the ConfidentialTransferAccount extension portion of the token account data
    println!("🔍 Unpacking ConfidentialTransferAccount extension from token account data");
    let confidential_transfer_account =
        token_account_info.get_extension::<ConfidentialTransferAccount>()?;
    println!("✅ Successfully unpacked ConfidentialTransferAccount extension");

    // ConfidentialTransferAccount extension information needed to construct an `ApplyPendingBalance` instruction.
    println!("🔄 Creating ApplyPendingBalanceAccountInfo from confidential transfer account");
    let apply_pending_balance_account_info =
        ApplyPendingBalanceAccountInfo::new(confidential_transfer_account);
    println!("✅ Successfully created ApplyPendingBalanceAccountInfo");

    // Return the number of times the pending balance has been credited
    println!("🔢 Getting pending balance credit counter");
    let expected_pending_balance_credit_counter =
        apply_pending_balance_account_info.pending_balance_credit_counter();
    println!(
        "✅ Pending balance credit counter: {}",
        expected_pending_balance_credit_counter
    );

    // Update the decryptable available balance (add pending balance to available balance)
    println!("🔐 Calculating new decryptable available balance");
    let new_decryptable_available_balance = apply_pending_balance_account_info
        .new_decryptable_available_balance(&elgamal_keypair.secret(), &aes_key)
        .map_err(|_| {
            println!(
                "⛔️ Failed to calculate new decryptable available balance: AccountDecryption error"
            );
            AppError::TokenError(TokenError::AccountDecryption)
        })?;
    println!("✅ Successfully calculated new decryptable available balance");

    // Create a `ApplyPendingBalance` instruction
    println!("📋 Creating apply_pending_balance instruction");
    let apply_pending_balance_instruction = apply_pending_balance(
        &spl_token_2022::id(),
        &ata,                                      // Token account
        expected_pending_balance_credit_counter, // Expected number of times the pending balance has been credited
        &new_decryptable_available_balance.into(), // Cipher text of the new decryptable available balance
        &ata_authority,                            // Token account owner
        &[&ata_authority],                         // Additional signers
    )
    .map_err(|e| {
        println!(
            "⛔️ Failed to create apply_pending_balance instruction: {}",
            e
        );
        AppError::SerializationError
    })?;
    println!("✅ Successfully created apply_pending_balance instruction");

    // Parse the provided blockhash from the request
    let client_blockhash = parse_latest_blockhash(&request.latest_blockhash)?;

    // Create a V0 message with the dummy blockhash
    println!("📝 Creating V0 message");
    let v0_message = v0::Message::try_compile(
        &ata_authority,
        &[apply_pending_balance_instruction],
        &[],
        client_blockhash,
    )
    .map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    // Get the number of required signatures before moving v0_message
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!(
        "🔑 Transaction requires {} signatures",
        num_required_signatures
    );

    // Create a versioned message
    println!("📝 Creating versioned message");
    let versioned_message = VersionedMessage::V0(v0_message);

    // Create a versioned transaction with placeholder signatures for required signers
    println!("📝 Creating versioned transaction with placeholder signatures");
    let mut signatures = Vec::with_capacity(num_required_signatures);

    // Add empty signatures as placeholders (will be replaced by the client's connected wallet)
    for _ in 0..num_required_signatures {
        signatures.push(solana_sdk::signature::Signature::default());
    }

    let versioned_transaction = VersionedTransaction {
        signatures,
        message: versioned_message,
    };

    // Serialize the transaction to base64
    println!("🔄 Serializing transaction");
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };
    println!("✅ Transaction created successfully");

    // Return the transaction
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: format!(
            "Created apply_cb transaction for mint: {} using client-provided account data",
            mint_pubkey
        ),
    }))
}
