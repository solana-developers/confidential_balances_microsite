use {
    crate::{
        errors::AppError,
        models::{CreateCbAtaRequest, TransactionResponse},
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
    spl_associated_token_account::{
        get_associated_token_address_with_program_id, instruction::create_associated_token_account,
    },
    spl_token_2022::{
        extension::{
            confidential_transfer::instruction::{configure_account, PubkeyValidityProofData},
            ExtensionType,
        },
        instruction::reallocate,
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair},
    },
    spl_token_confidential_transfer_proof_extraction::instruction::{ProofData, ProofLocation},
};

/// Handler for creating a Confidential Balances associated token account
pub async fn create_cb_ata(
    Json(request): Json<CreateCbAtaRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🚀 Starting create_cb_ata handler");
    println!(
        "📝 Request data: mint={}, authority={}",
        request.mint, request.ata_authority
    );

    // Parse the authority address
    println!("🔑 Parsing authority address");
    let token_account_authority = parse_base64_base58_pubkey(&request.ata_authority)?;
    println!(
        "✅ Authority parsed successfully: {}",
        token_account_authority
    );

    // Parse the mint address
    println!("🪙 Parsing mint address");
    let mint = parse_base64_base58_pubkey(&request.mint)?;
    println!("✅ Mint parsed successfully: {}", mint);

    // Associated token address for caller
    println!("🔍 Deriving associated token address");
    let token_account_pubkey = get_associated_token_address_with_program_id(
        &token_account_authority, // Token account owner
        &mint,                    // Mint
        &spl_token_2022::id(),
    );
    println!(
        "✅ Associated token address derived: {}",
        token_account_pubkey
    );

    // Instruction to create associated token account
    println!("📋 Creating instruction to create associated token account");
    let create_associated_token_account_instruction = create_associated_token_account(
        &token_account_authority, // Funding account
        &token_account_authority, // Token account owner
        &mint,                    // Mint
        &spl_token_2022::id(),
    );
    println!("✅ Create ATA instruction created");

    // Instruction to reallocate the token account to include the `ConfidentialTransferAccount` extension
    println!("📋 Creating instruction to reallocate token account for confidential transfers");
    let reallocate_instruction = reallocate(
        &spl_token_2022::id(),
        &token_account_pubkey,                         // Token account
        &token_account_authority,                      // Payer
        &token_account_authority,                      // Token account owner
        &[&token_account_authority],                   // Signers
        &[ExtensionType::ConfidentialTransferAccount], // Extension to reallocate space for
    )?;
    println!("✅ Reallocate instruction created");

    // Create the ElGamal keypair and AES key for the sender token account
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

    let token_account_authority_elgamal_keypair =
        ElGamalKeypair::new_from_signature(&elgamal_signature)
            .map_err(|_| AppError::SerializationError)?;
    println!("✅ ElGamal keypair created successfully");

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

    let token_account_authority_aes_key =
        AeKey::new_from_signature(&aes_signature).map_err(|_| AppError::SerializationError)?;
    println!("✅ AES key created successfully");

    // The maximum number of `Deposit` and `Transfer` instructions that can
    // credit `pending_balance` before the `ApplyPendingBalance` instruction is executed
    let maximum_pending_balance_credit_counter = 65536;
    println!(
        "📊 Setting maximum_pending_balance_credit_counter to {}",
        maximum_pending_balance_credit_counter
    );

    // Initial token balance is 0
    println!("💰 Setting initial decryptable balance to 0");
    let decryptable_balance = token_account_authority_aes_key.encrypt(0);
    println!("🔒 Balance encrypted successfully");

    // The instruction data that is needed for the `ProofInstruction::VerifyPubkeyValidity` instruction.
    println!("🧩 Generating pubkey validity proof data");
    let proof_data = PubkeyValidityProofData::new(&token_account_authority_elgamal_keypair)
        .map_err(|_| AppError::ProofGeneration)?;
    println!("✅ Pubkey validity proof data generated successfully");

    // `InstructionOffset` indicates that proof is included in the same transaction
    println!("📍 Setting proof location to InstructionOffset(1)");
    let proof_location = ProofLocation::InstructionOffset(
        1.try_into().unwrap(),
        ProofData::InstructionData(&proof_data),
    );

    println!("📋 Creating configure_account instruction");
    let configure_account_instruction = configure_account(
        &spl_token_2022::id(),                  // Program ID
        &token_account_pubkey,                  // Token account
        &mint,                                  // Mint
        &decryptable_balance.into(),            // Initial balance
        maximum_pending_balance_credit_counter, // Maximum pending balance credit counter
        &token_account_authority,               // Token Account Owner
        &[],                                    // Additional signers
        proof_location,                         // Proof location
    )?;
    println!("✅ Configure account instructions created successfully");

    println!("🔄 Combining all instructions");
    let mut instructions = vec![
        create_associated_token_account_instruction,
        reallocate_instruction,
    ];
    instructions.extend(configure_account_instruction);
    println!("✅ Combined {} instructions", instructions.len());

    // Parse the provided blockhash from the request
    let client_blockhash = parse_latest_blockhash(&request.latest_blockhash)?;

    println!("📝 Creating V0 message");
    let v0_message = v0::Message::try_compile(
        &token_account_authority,
        &instructions,
        &[],
        client_blockhash,
    )
    .map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!(
        "🔑 Transaction requires {} signatures",
        num_required_signatures
    );

    println!("📝 Creating versioned message");
    let versioned_message = VersionedMessage::V0(v0_message);

    println!("📝 Creating versioned transaction with placeholder signatures");
    // Create a versioned transaction with placeholder signatures for required signers
    let mut signatures = Vec::with_capacity(num_required_signatures);

    // Add empty signatures as placeholders (will be replaced by the wallet)
    for _ in 0..num_required_signatures {
        signatures.push(solana_sdk::signature::Signature::default());
    }

    let versioned_transaction = VersionedTransaction {
        signatures,
        message: versioned_message,
    };

    // Serialize the transaction to base64
    println!("🔄 Serializing transaction to base64");
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };
    println!(
        "✅ Transaction serialized successfully, size: {} bytes",
        serialized_transaction.len()
    );

    println!("🎉 Transaction creation completed successfully");
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Confidential Balances ATA transaction created successfully".to_string(),
    }))
}
