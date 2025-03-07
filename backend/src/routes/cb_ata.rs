use {
    axum::extract::Json,
    solana_sdk::{hash::Hash, message::{v0, VersionedMessage}, pubkey::Pubkey, signature::Signature, transaction::VersionedTransaction},
    bs58,
    bincode,
    base64::{Engine as _, engine::general_purpose::STANDARD as BASE64_STANDARD},
    spl_associated_token_account::{get_associated_token_address_with_program_id, instruction::create_associated_token_account},
    spl_token_2022::{
        error::TokenError,
        extension::{
            confidential_transfer::{
                account_info::ApplyPendingBalanceAccountInfo,
                instruction::{apply_pending_balance, configure_account, deposit, PubkeyValidityProofData},
                ConfidentialTransferAccount
            },
            BaseStateWithExtensions,
            ExtensionType,
            StateWithExtensionsOwned
        },
        instruction::reallocate,
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair}
    },
    spl_token_confidential_transfer_proof_extraction::instruction::{ProofData, ProofLocation},
    crate::models::{CreateCbAtaRequest, TransactionResponse, DepositCbRequest, ApplyCbRequest},
    crate::errors::AppError,
};


// Helper function to parse a base64-encoded base58 address into a Pubkey
fn parse_base64_base58_pubkey(encoded_address: &str) -> Result<Pubkey, AppError> {
    println!("🔍 Attempting to parse base64-base58 pubkey: {}", encoded_address);
    
    // First, try to decode from base64
    let decoded_base64 = BASE64_STANDARD.decode(encoded_address)?;
    println!("✅ Base64 decoding successful, got {} bytes", decoded_base64.len());
    
    // Then, decode the resulting string as base58
    let decoded_string = String::from_utf8(decoded_base64)?;
    println!("✅ UTF-8 decoding successful: {}", decoded_string);
    
    // Finally, decode the base58 string to bytes
    let bytes = bs58::decode(&decoded_string).into_vec()?;
    println!("✅ Base58 decoding successful, got {} bytes", bytes.len());
    
    if bytes.len() != 32 {
        println!("❌ Invalid pubkey length: expected 32 bytes, got {}", bytes.len());
        return Err(AppError::InvalidAddress);
    }
    
    // Convert to fixed-size array and create Pubkey
    let bytes_array: [u8; 32] = bytes.try_into().unwrap();
    let pubkey = Pubkey::new_from_array(bytes_array);
    println!("✅ Successfully created Pubkey: {}", pubkey.to_string());
    
    Ok(pubkey)
}

// Handler for creating a Confidential Balances associated token account
pub async fn create_cb_ata(
    Json(request): Json<CreateCbAtaRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🚀 Starting create_cb_ata handler");
    println!("📝 Request data: mint={}, authority={}", request.mint, request.ata_authority);
    
    // Parse the authority address
    println!("🔑 Parsing authority address");
    let token_account_authority = parse_base64_base58_pubkey(&request.ata_authority)?;
    println!("✅ Authority parsed successfully: {}", token_account_authority);
    
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
    println!("✅ Associated token address derived: {}", token_account_pubkey);
    
    // Instruction to create associated token account
    println!("📋 Creating instruction to create associated token account");
    let create_associated_token_account_instruction = create_associated_token_account(
        &token_account_authority,       // Funding account
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
        &token_account_authority,                   // Payer
        &token_account_authority,             // Token account owner
        &[&token_account_authority],          // Signers
        &[ExtensionType::ConfidentialTransferAccount], // Extension to reallocate space for
    )?;
    println!("✅ Reallocate instruction created");

    // Create the ElGamal keypair and AES key for the sender token account
    println!("🔐 Decoding ElGamal signature: {}", request.elgamal_signature);
    let decoded_elgamal_signature = BASE64_STANDARD.decode(&request.elgamal_signature)?;
    println!("✅ ElGamal signature base64 decoded, got {} bytes", decoded_elgamal_signature.len());
    
    // Create signature directly from bytes
    let elgamal_signature = Signature::try_from(decoded_elgamal_signature.as_slice())
        .map_err(|_| AppError::SerializationError)?;
    println!("✅ ElGamal signature created successfully");
    
    let token_account_authority_elgamal_keypair = ElGamalKeypair::new_from_signature(&elgamal_signature)
        .map_err(|_| AppError::SerializationError)?;
    println!("✅ ElGamal keypair created successfully");

    println!("🔐 Decoding AES signature: {}", request.aes_signature);
    let decoded_aes_signature = BASE64_STANDARD.decode(&request.aes_signature)?;
    println!("✅ AES signature base64 decoded, got {} bytes", decoded_aes_signature.len());
    
    // Create signature directly from bytes
    let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
        .map_err(|_| AppError::SerializationError)?;
    println!("✅ AES signature created successfully");
    
    let token_account_authority_aes_key = AeKey::new_from_signature(&aes_signature)
        .map_err(|_| AppError::SerializationError)?;
    println!("✅ AES key created successfully");

    // The maximum number of `Deposit` and `Transfer` instructions that can
    // credit `pending_balance` before the `ApplyPendingBalance` instruction is executed
    let maximum_pending_balance_credit_counter = 65536;
    println!("📊 Setting maximum_pending_balance_credit_counter to {}", maximum_pending_balance_credit_counter);

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

    // Instructions to configure the token account, including the proof instruction
    println!("📋 Creating configure_account instruction");
    let configure_account_instruction = configure_account(
        &spl_token_2022::id(),                 // Program ID
        &token_account_pubkey,                 // Token account
        &mint,                        // Mint
        &decryptable_balance.into(),             // Initial balance
        maximum_pending_balance_credit_counter, // Maximum pending balance credit counter
        &token_account_authority,     // Token Account Owner
        &[],                                   // Additional signers
        proof_location,                         // Proof location
    )?;
    println!("✅ Configure account instructions created successfully");

    // Instructions to configure account must come after `initialize_account` instruction
    println!("🔄 Combining all instructions");
    let mut instructions = vec![
        create_associated_token_account_instruction,
        reallocate_instruction,
    ];
    instructions.extend(configure_account_instruction);
    println!("✅ Combined {} instructions", instructions.len());

    // Use a dummy non-zero blockhash that the frontend will replace
    println!("🧱 Using dummy blockhash");
    let dummy_blockhash = Hash::default();

    // Create a V0 message with the dummy blockhash
    println!("📝 Creating V0 message");
    let v0_message = v0::Message::try_compile(
        &token_account_authority,
        &instructions,
        &[],
        dummy_blockhash,
    ).map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    // Get the number of required signatures before moving v0_message
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!("🔑 Transaction requires {} signatures", num_required_signatures);
    
    // Create a versioned message
    println!("📝 Creating versioned message");
    let versioned_message = VersionedMessage::V0(v0_message);
    
    // Create a versioned transaction with placeholder signatures for required signers
    println!("📝 Creating versioned transaction with placeholder signatures");
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
    let serialized_transaction = bincode::serialize(&versioned_transaction)
        .map(|bytes| BASE64_STANDARD.encode(bytes))?;
    println!("✅ Transaction serialized successfully, size: {} bytes", serialized_transaction.len());
    
    println!("🎉 Transaction creation completed successfully");
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Confidential Balances ATA transaction created successfully".to_string(),
    }))
}

// Handler for depositing to a Confidential Balances account
pub async fn deposit_cb(
    Json(request): Json<DepositCbRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🚀 Starting deposit_cb handler");
    
    // Parse the authority address
    println!("� Parsing authority address");
    let token_account_authority = parse_base64_base58_pubkey(&request.ata_authority)?;
    println!("✅ Authority parsed successfully: {}", token_account_authority);
    
    // Parse the mint address
    println!("🪙 Parsing mint address");
    let mint = parse_base64_base58_pubkey(&request.mint)?;
    println!("✅ Mint parsed successfully: {}", mint);
    
    // Parse the amount to deposit
    println!("💰 Parsing amount: {}", request.lamport_amount);
    let deposit_amount = match request.lamport_amount.parse::<u64>() {
        Ok(value) => {
            println!("✅ Amount parsed successfully: {} lamports", value);
            value
        },
        Err(e) => {
            println!("❌ Failed to parse amount: {:?}", e);
            return Err(AppError::InvalidAmount);
        }
    };

    let depositor_token_account = get_associated_token_address_with_program_id(
        &token_account_authority, // Token account owner
        &mint,        // Mint
        &spl_token_2022::id(),
    );

    // Instruction to deposit from non-confidential balance to "pending" balance
    let deposit_instruction = deposit(
        &spl_token_2022::id(),
        &depositor_token_account, // Token account
        &mint,                   // Mint
        deposit_amount,                   // Amount to deposit
        request.mint_decimals,                         // Mint decimals
        &token_account_authority,               // Token account owner
        &[&token_account_authority],            // Signers
    )?;

    // Use Hash::default() instead of hardcoded blockhash
    let dummy_blockhash = Hash::default();
    
    // Create a V0 message with the dummy blockhash
    let v0_message = v0::Message::try_compile(
        &token_account_authority,
        &[deposit_instruction],
        &[],
        dummy_blockhash,
    ).map_err(|_| AppError::SerializationError)?;

    // Get the number of required signatures before moving v0_message
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    
    // Create a versioned message
    let versioned_message = VersionedMessage::V0(v0_message);
    
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
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };
    
    println!("✅ Transaction created successfully");
    
    // Empty handler implementation
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Deposit CB transaction not yet implemented".to_string(),
    }))
}

pub async fn apply_cb(
    Json(request): Json<ApplyCbRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🔄 Processing apply_cb request for mint: {}", request.mint);
    
    // Parse the authority address
    let ata_authority = parse_base64_base58_pubkey(&request.ata_authority)?;
    println!("✅ Parsed authority pubkey: {}", ata_authority);
    
    // Parse the mint address
    let mint_pubkey = parse_base64_base58_pubkey(&request.mint)?;
    println!("✅ Parsed mint pubkey: {}", mint_pubkey);
    
    // Parse ElGamal signature
    println!("🔐 Decoding ElGamal signature: {}", request.elgamal_signature);
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
    
    let aes_key = AeKey::new_from_signature(&aes_signature)
        .map_err(|_| AppError::SerializationError)?;
    
    // Decode token account data from request instead of fetching it
    println!("📦 Decoding token account data from request");
    let token_account_data = BASE64_STANDARD.decode(&request.token_account_data)?;
    
    // Deserialize the account data
    let token_account_info = StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(token_account_data)?;
    println!("✅ Successfully decoded token account data from owner {}", token_account_info.base.owner.to_string());
    
    
    // Get the associated token account address
    let ata = get_associated_token_address_with_program_id(
        &ata_authority,
        &mint_pubkey,
        &spl_token_2022::id(),
    );
    println!("✅ Calculated ATA address: {}", ata);

    // Unpack the ConfidentialTransferAccount extension portion of the token account data
    let confidential_transfer_account =
        token_account_info.get_extension::<ConfidentialTransferAccount>()?;

    // ConfidentialTransferAccount extension information needed to construct an `ApplyPendingBalance` instruction.
    let apply_pending_balance_account_info =
        ApplyPendingBalanceAccountInfo::new(confidential_transfer_account);

    // Return the number of times the pending balance has been credited
    let expected_pending_balance_credit_counter =
        apply_pending_balance_account_info.pending_balance_credit_counter();

    // Update the decryptable available balance (add pending balance to available balance)
    let new_decryptable_available_balance = apply_pending_balance_account_info
        .new_decryptable_available_balance(&elgamal_keypair.secret(), &aes_key)
        .map_err(|_| AppError::TokenError(TokenError::AccountDecryption))?;

    // Create a `ApplyPendingBalance` instruction
    let apply_pending_balance_instruction = apply_pending_balance(
        &spl_token_2022::id(),
        &ata,         // Token account
        expected_pending_balance_credit_counter, // Expected number of times the pending balance has been credited
        &new_decryptable_available_balance.into(), // Cipher text of the new decryptable available balance
        &ata_authority,                       // Token account owner
        &[&ata_authority],                    // Additional signers
    ).map_err(|_| AppError::SerializationError)?;
    
    // Create a dummy recent blockhash
    let dummy_blockhash = Hash::new_unique();

    // Create a V0 message with the dummy blockhash
    println!("📝 Creating V0 message");
    let v0_message = v0::Message::try_compile(
        &ata_authority,
        &[apply_pending_balance_instruction],
        &[],
        dummy_blockhash,
    ).map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");
    
    // Get the number of required signatures before moving v0_message
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!("🔑 Transaction requires {} signatures", num_required_signatures);
    
    // Create a versioned message
    println!("📝 Creating versioned message");
    let versioned_message = VersionedMessage::V0(v0_message);
    
    // Create a versioned transaction with placeholder signatures for required signers
    println!("📝 Creating versioned transaction with placeholder signatures");
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
    println!("🔄 Serializing transaction");
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };
    println!("✅ Transaction created successfully");
    
    // Return the transaction
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: format!("Created apply_cb transaction for mint: {} using client-provided account data", mint_pubkey),
    }))
} 