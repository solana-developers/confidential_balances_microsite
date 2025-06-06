use {
    crate::{errors::AppError, models::{
        ApplyCbRequest, CreateCbAtaRequest, DecryptCbRequest, DecryptCbResponse, DepositCbRequest, MultiTransactionResponse, TransactionResponse, TransferCbRequest, TransferCbSpaceResponse, WithdrawCbRequest, WithdrawCbSpaceResponse
    }},
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode, bs58, solana_sdk::{hash::Hash, message::{v0, VersionedMessage}, pubkey::Pubkey, signature::{Keypair, NullSigner, Signature}, signer::Signer, system_instruction, transaction::VersionedTransaction},
    solana_zk_sdk::{encryption::auth_encryption::AeCiphertext, zk_elgamal_proof_program::{self, instruction::{close_context_state, ContextStateInfo}}},
    spl_associated_token_account::{get_associated_token_address_with_program_id, instruction::create_associated_token_account},
    spl_token_2022::{
        error::TokenError,
        extension::{
            confidential_transfer::{
                account_info::{ApplyPendingBalanceAccountInfo, TransferAccountInfo, WithdrawAccountInfo},
                instruction::{apply_pending_balance, configure_account, deposit, transfer, withdraw, PubkeyValidityProofData},
                ConfidentialTransferAccount
            },
            BaseStateWithExtensions,
            ExtensionType,
            StateWithExtensionsOwned
        },
        instruction::reallocate,
        solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair}
    }, spl_token_confidential_transfer_proof_extraction::instruction::{ProofData, ProofLocation}, spl_token_confidential_transfer_proof_generation::{transfer::TransferProofData, withdraw::WithdrawProofData}, std::str::FromStr
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

    println!("🔄 Combining all instructions");
    let mut instructions = vec![
        create_associated_token_account_instruction,
        reallocate_instruction,
    ];
    instructions.extend(configure_account_instruction);
    println!("✅ Combined {} instructions", instructions.len());

    let dummy_blockhash = Hash::default();

    println!("📝 Creating V0 message");
    let v0_message = v0::Message::try_compile(
        &token_account_authority,
        &instructions,
        &[],
        dummy_blockhash,
    ).map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!("🔑 Transaction requires {} signatures", num_required_signatures);

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

    // Deserialize the account data
    println!("📦 Decoding token account data from request");
    let token_account_info = {
        // Decode token account data from request instead of fetching it
        let token_account_data = BASE64_STANDARD.decode(&request.token_account_data)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(token_account_data)?
    };

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

    let mint = token_account_info.base.mint;
    let token_account_authority = token_account_info.base.owner;

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
    println!("✅ Successfully decoded ATA data from owner {}", token_account_info.base.owner.to_string());

    // Parse the mint address
    let mint_pubkey = token_account_info.base.mint;

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
    println!("✅ Pending balance credit counter: {}", expected_pending_balance_credit_counter);

    // Update the decryptable available balance (add pending balance to available balance)
    println!("🔐 Calculating new decryptable available balance");
    let new_decryptable_available_balance = apply_pending_balance_account_info
        .new_decryptable_available_balance(&elgamal_keypair.secret(), &aes_key)
        .map_err(|_| {
            println!("❌ Failed to calculate new decryptable available balance: AccountDecryption error");
            AppError::TokenError(TokenError::AccountDecryption)
        })?;
    println!("✅ Successfully calculated new decryptable available balance");

    // Create a `ApplyPendingBalance` instruction
    println!("📋 Creating apply_pending_balance instruction");
    let apply_pending_balance_instruction = apply_pending_balance(
        &spl_token_2022::id(),
        &ata,         // Token account
        expected_pending_balance_credit_counter, // Expected number of times the pending balance has been credited
        &new_decryptable_available_balance.into(), // Cipher text of the new decryptable available balance
        &ata_authority,                       // Token account owner
        &[&ata_authority],                    // Additional signers
    ).map_err(|e| {
        println!("❌ Failed to create apply_pending_balance instruction: {:?}", e);
        AppError::SerializationError
    })?;
    println!("✅ Successfully created apply_pending_balance instruction");

    // Create a dummy recent blockhash
    println!("🔑 Creating dummy blockhash for transaction");
    let dummy_blockhash = Hash::new_unique();
    println!("✅ Created dummy blockhash: {}", dummy_blockhash);

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

/// Handler for the transfer-cb endpoint
///
/// This endpoint creates a transaction to transfer tokens between confidential token accounts
pub async fn transfer_cb(
    Json(request): Json<TransferCbRequest>,
) -> Result<Json<MultiTransactionResponse>, AppError> {
    println!("📝 Processing transfer-cb request");

    // Decode amount from request
    println!("📦 Decoding amount from request");
    let transfer_amount_lamports = request.amount.parse::<u64>()
        .map_err(|_| AppError::InvalidAmount)?;
    println!("✅ Successfully decoded amount: {}", transfer_amount_lamports);

    // Parse rent values for proof account creation
    let equality_proof_rent = request.equality_proof_rent.parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let ciphertext_validity_proof_rent = request.ciphertext_validity_proof_rent.parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let range_proof_rent = request.range_proof_rent.parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;

    // Decode sender token account data from request
    println!("📦 Decoding sender token account data from request");
    let sender_token_account_info = {
        let sender_token_account_data = BASE64_STANDARD.decode(&request.sender_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(sender_token_account_data)?
    };
    println!("✅ Successfully decoded sender token account data from owner {}", sender_token_account_info.base.owner.to_string());

    // Decode recipient token account data from request
    println!("📦 Decoding recipient token account data from request");
    let recipient_token_account_info = {
        let recipient_token_account_data = BASE64_STANDARD.decode(&request.recipient_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(recipient_token_account_data)?
    };
    println!("✅ Successfully decoded recipient token account data from owner {}", recipient_token_account_info.base.owner.to_string());

    // Verify that both accounts reference the same mint
    let mint = {
        let sender_mint = sender_token_account_info.base.mint;
        let recipient_mint = recipient_token_account_info.base.mint;

        if sender_token_account_info.base.mint != recipient_token_account_info.base.mint {
            println!("❌ Mint mismatch: sender mint {} does not match recipient mint {}",
                sender_mint.to_string(), recipient_mint.to_string());
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
    println!("✅ Calculated sender token account address: {}", sender_token_account);

    // Get the recipient token account address
    let recipient_ata_authority = recipient_token_account_info.base.owner;
    let recipient_token_account = get_associated_token_address_with_program_id(
        &recipient_ata_authority,
        &mint,
        &spl_token_2022::id(),
    );
    println!("✅ Calculated recipient token account address: {}", recipient_token_account);


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

    let recipient_elgamal_pubkey: solana_zk_sdk::encryption::elgamal::ElGamalPubkey  =
        recipient_token_account_info.get_extension::<ConfidentialTransferAccount>()?
        .elgamal_pubkey.try_into()?;

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
        println!("🔐 Decoding ElGamal signature: {}", request.elgamal_signature);
        let decoded_elgamal_signature = BASE64_STANDARD.decode(&request.elgamal_signature)?;
        println!("✅ ElGamal signature base64 decoded, got {} bytes", decoded_elgamal_signature.len());

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
        println!("✅ AES signature base64 decoded, got {} bytes", decoded_aes_signature.len());

        // Create signature directly from bytes
        let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
            .map_err(|_| AppError::SerializationError)?;
        println!("✅ AES signature created successfully");

        AeKey::new_from_signature(&aes_signature)
            .map_err(|_| AppError::SerializationError)?
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
    let (range_create_ix, range_verify_ix) = get_zk_proof_context_state_account_creation_instructions(
        &sender_ata_authority,
        &range_proof_context_state_account.pubkey(),
        &context_state_authority,
        &range_proof_data,
        range_proof_rent,
    )?;

    // Equality Proof Instructions---------------------------------------------------------------------------
    let (equality_create_ix, equality_verify_ix) = get_zk_proof_context_state_account_creation_instructions(
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
    let client_blockhash = Hash::from_str(&request.latest_blockhash).map_err(|_| AppError::SerializationError)?;

    // Parse priority fee
    let priority_fee = match request.priority_fee.parse::<u64>() {
        Ok(fee) => fee,
        Err(_) => {
            println!("⚠️ Invalid priority fee format: {}, defaulting to 0", request.priority_fee);
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
                &solana_sdk::compute_budget::ComputeBudgetInstruction::SetComputeUnitPrice(micro_lamports),
                vec![],
            ));
        }

        // Add the original instructions
        instructions.push(range_create_ix.clone());
        instructions.push(equality_create_ix.clone());
        instructions.push(cv_create_ix.clone());

        // Rest of the code remains the same...
        let message = v0::Message::try_compile(
            &sender_ata_authority,
            &instructions,
            &[],
            client_blockhash,
        )?;

        // Create a versioned message
        let versioned_message = VersionedMessage::V0(message.clone());

        VersionedTransaction::try_new(versioned_message,
        &[
            &NullSigner::new(&sender_ata_authority) as &dyn Signer,
            &range_proof_context_state_account,
            &equality_proof_context_state_account,
            &ciphertext_validity_proof_context_state_account,
        ])?
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
            ProofLocation::ContextStateAccount(&ciphertext_validity_proof_context_state_account.pubkey()),
            ProofLocation::ContextStateAccount(&range_proof_context_state_account.pubkey()),
        )?;

        let message = v0::Message::try_compile(
            &sender_ata_authority,
            &instructions,
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
        transactions: transactions.into_iter().enumerate().map(|(i, tx)| {
            let serialized_transaction = match bincode::serialize(&tx) {
                Ok(bytes) => BASE64_STANDARD.encode(bytes),
                Err(_) => return Err(AppError::SerializationError),
            };
            println!("✅ Successfully serialized transaction {}", i + 1);

            Ok(serialized_transaction)
        }).collect::<Result<Vec<String>, AppError>>()?,
        message: "MultiTransaction for confidential transfer created successfully".to_string(),
    };

    Ok(Json(response))

}

/// Handler for the withdraw-cb endpoint
///
/// This endpoint creates a transaction to withdraw tokens from a confidential token account
pub async fn withdraw_cb(
    Json(request): Json<WithdrawCbRequest>,
) -> Result<Json<MultiTransactionResponse>, AppError> {
    println!("📝 Processing withdraw-cb request");

    // Decode recipient token account info
    let recipient_token_account_info = {
        let recipient_token_account_data = BASE64_STANDARD.decode(&request.recipient_token_account)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(recipient_token_account_data)?
    };

    // Parse rent values for proof account creation
    let equality_proof_rent = request.equality_proof_rent.parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;
    let range_proof_rent = request.range_proof_rent.parse::<u64>()
        .map_err(|_| AppError::SerializationError)?;

    // Decode mint account info
    let mint_account_info = {
        let mint_account_data = BASE64_STANDARD.decode(&request.mint_account_info)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Mint>::unpack(mint_account_data)?
    };

    // Decode client blockhash
    let client_blockhash = Hash::from_str(&request.latest_blockhash).map_err(|_| AppError::SerializationError)?;

    // Decode withdraw amount
    let withdraw_amount = u64::from_str(&request.withdraw_amount_lamports).map_err(|_| AppError::SerializationError)?;

    // Create the ElGamal keypair and AES key for the sender token account
    // Create the sender's ElGamal keypair in a temporary scope
    let receiver_elgamal_keypair = {
        println!("🔐 Decoding ElGamal signature: {}", request.elgamal_signature);
        let decoded_elgamal_signature = BASE64_STANDARD.decode(&request.elgamal_signature)?;
        println!("✅ ElGamal signature base64 decoded, got {} bytes", decoded_elgamal_signature.len());

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
        println!("✅ AES signature base64 decoded, got {} bytes", decoded_aes_signature.len());

        // Create signature directly from bytes
        let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
            .map_err(|_| AppError::SerializationError)?;
        println!("✅ AES signature created successfully");

        AeKey::new_from_signature(&aes_signature)
            .map_err(|_| AppError::SerializationError)?
    };
    println!("✅ AES key created successfully");

    // Unpack the ConfidentialTransferAccount extension portion of the token account data
    let extension_data = recipient_token_account_info.get_extension::<ConfidentialTransferAccount>()?;

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
    let (range_create_ix, range_verify_ix) = get_zk_proof_context_state_account_creation_instructions(
        &context_state_authority,
        &range_proof_context_state_keypair.pubkey(),
        &context_state_authority,
        &range_proof_data,
        range_proof_rent,
    )?;

    // Equality Proof Instructions---------------------------------------------------------------------------
    let (equality_create_ix, equality_verify_ix) = get_zk_proof_context_state_account_creation_instructions(
        &context_state_authority,
        &equality_proof_context_state_keypair.pubkey(),
        &context_state_authority,
        &equality_proof_data,
        equality_proof_rent,
    )?;

    let tx1 = {

        let message = v0::Message::try_compile(
            &context_state_authority,
            &[
                equality_create_ix,
                equality_verify_ix,
                range_create_ix
            ],
            &[],
            client_blockhash,
        )?;

        let versioned_message = VersionedMessage::V0(message.clone());
        VersionedTransaction::try_new(versioned_message,
        &[
            &NullSigner::new(&context_state_authority) as &dyn Signer,
            &range_proof_context_state_keypair,
            &equality_proof_context_state_keypair,
        ])?
    };

    let tx2 = {
        let message = v0::Message::try_compile(
            &context_state_authority,
            &[range_verify_ix],
            &[],
            client_blockhash,
        )?;

        let versioned_message = VersionedMessage::V0(message.clone());
        VersionedTransaction::try_new(versioned_message,
        &[
            &NullSigner::new(&context_state_authority) as &dyn Signer,
        ])?
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
            &[close_equality_proof_instruction, close_range_proof_instruction],
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
        transactions: transactions.into_iter().enumerate().map(|(i, tx)| {
            let serialized_transaction = match bincode::serialize(&tx) {
                Ok(bytes) => BASE64_STANDARD.encode(bytes),
                Err(_) => return Err(AppError::SerializationError),
            };
            println!("✅ Successfully serialized transaction {}", i + 1);

            Ok(serialized_transaction)
        }).collect::<Result<Vec<String>, AppError>>()?,
        message: "MultiTransaction for confidential transfer created successfully".to_string(),
    };

    Ok(Json(response))
}

/// Refactored version of spl_token_client::token::Token::confidential_transfer_create_context_state_account().
/// Instead of sending transactions internally or calculating rent via RPC, this function now accepts
/// the rent value from the caller and returns the instructions to be used externally.
fn get_zk_proof_context_state_account_creation_instructions<
    ZK: bytemuck::Pod + zk_elgamal_proof_program::proof_data::ZkProofData<U>,
    U: bytemuck::Pod,
>(
    fee_payer_pubkey: &Pubkey,
    context_state_account_pubkey: &Pubkey,
    context_state_authority_pubkey: &Pubkey,
    proof_data: &ZK,
    rent: u64,
) -> Result<(solana_sdk::instruction::Instruction, solana_sdk::instruction::Instruction), AppError> {
    use std::mem::size_of;
    use spl_token_confidential_transfer_proof_extraction::instruction::zk_proof_type_to_instruction;

    let space = size_of::<zk_elgamal_proof_program::state::ProofContextState<U>>();
    println!("📊 Context state account space required: {} bytes", space);
    println!("💰 Using provided rent for context state account: {} lamports", rent);

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
        &zk_elgamal_proof_program::id(),
    );

    let verify_proof_ix =
        instruction_type.encode_verify_proof(Some(context_state_info), proof_data);

    // Return a tuple containing the create account instruction and verify proof instruction.
    Ok((create_account_ix, verify_proof_ix))
}

/// GET handler to provide space requirements for transfer-cb operation
pub async fn transfer_cb_space() -> Result<Json<TransferCbSpaceResponse>, AppError> {
    println!("📊 Processing transfer-cb-space request");

    let equality_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::ciphertext_commitment_equality::CiphertextCommitmentEqualityProofContext
    >>();

    let ciphertext_validity_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_grouped_ciphertext_validity::BatchedGroupedCiphertext3HandlesValidityProofContext
    >>();

    let range_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_range_proof::batched_range_proof_u128::BatchedRangeProofU128Data
    >>();

    Ok(Json(TransferCbSpaceResponse {
        equality_proof_space,
        ciphertext_validity_proof_space,
        range_proof_space,
        message: "Space requirements for transfer-cb proofs".to_string(),
    }))
}

/// GET handler to provide space requirements for withdraw-cb operation
pub async fn withdraw_cb_space() -> Result<Json<WithdrawCbSpaceResponse>, AppError> {
    println!("📊 Processing withdraw-cb-space request");

    let equality_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::ciphertext_commitment_equality::CiphertextCommitmentEqualityProofContext
    >>();

    let range_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_range_proof::batched_range_proof_u128::BatchedRangeProofU128Data
    >>();

    Ok(Json(WithdrawCbSpaceResponse {
        equality_proof_space,
        range_proof_space,
        message: "Space requirements for withdraw-cb proofs".to_string(),
    }))
}

// Handler for decrypting a Confidential Balance
pub async fn decrypt_cb(
    Json(request): Json<DecryptCbRequest>,
) -> Result<Json<DecryptCbResponse>, AppError> {
    println!("🔐 Starting decrypt_cb handler");

    // Create the AES key
    let aes_key = {
        let decoded_aes_signature = BASE64_STANDARD.decode(&request.aes_signature)?;

        let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
        .map_err(|_| AppError::SerializationError)?;

        AeKey::new_from_signature(&aes_signature)
            .map_err(|_| AppError::SerializationError)?
    };
    println!("✅ AES key created successfully");

    // Get the token account info
    let token_account_info = {
        // Decode token account data from request instead of fetching it
        let token_account_data = BASE64_STANDARD.decode(&request.token_account_data)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(token_account_data)?
    };
    println!("🧳 Unpacked token account info");

    let confidential_transfer_account =
        token_account_info.get_extension::<ConfidentialTransferAccount>()?;
    println!("🔍 Fetched confidential transfer account extension");

    let available_balance = confidential_transfer_account.decryptable_available_balance;
    let available_balance = AeCiphertext::try_from(available_balance).map_err(|_| AppError::SerializationError)?;
    println!("🔄 Reformatted available balance");
    let decrypted_balance = aes_key.decrypt(&available_balance).ok_or(AppError::SerializationError)?;

    println!("✅ Returning decrypted balance");
    Ok(Json(DecryptCbResponse {
        amount: decrypted_balance.to_string(),
        message: "Decryption successful".to_string(),
    }))
}
