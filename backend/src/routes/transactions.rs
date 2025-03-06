use axum::extract::Json;
use solana_sdk::{
    hash::Hash, instruction::{AccountMeta, Instruction}, message::{v0, VersionedMessage}, pubkey::Pubkey, signature::Signature, transaction::VersionedTransaction
};
use spl_memo::id as memo_program_id;
use bs58;
use bincode;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64_STANDARD};

use crate::models::{TransactionRequest, TransactionResponse, CreateCbAtaRequest};
use crate::errors::AppError;

use std::str::FromStr;
use std::error::Error;

//use utils::{get_or_create_keypair, get_rpc_client, print_transaction_url};
use solana_sdk::{signer::Signer, transaction::Transaction};
use spl_associated_token_account::{
    get_associated_token_address_with_program_id, instruction::create_associated_token_account,
};
use spl_token_2022::{
    error::TokenError,
    extension::{
        confidential_transfer::instruction::{configure_account, PubkeyValidityProofData},
        ExtensionType,
    },
    instruction::reallocate,
    solana_zk_sdk::encryption::{auth_encryption::AeKey, elgamal::ElGamalKeypair},
};
use spl_token_confidential_transfer_proof_extraction::instruction::{ProofData, ProofLocation};

// Helper function to parse a base64-encoded base58 address into a Pubkey
fn parse_base64_base58_pubkey(encoded_address: &str) -> Result<Pubkey, AppError> {
    println!("🔍 Attempting to parse base64-base58 pubkey: {}", encoded_address);
    
    // First decode from base64
    let base64_decoded = match BASE64_STANDARD.decode(encoded_address) {
        Ok(decoded) => {
            println!("✅ Base64 decoding successful, got {} bytes", decoded.len());
            decoded
        },
        Err(e) => {
            println!("❌ Base64 decoding failed: {}", e);
            return Err(AppError::InvalidAddress);
        }
    };
    
    // Convert the decoded bytes to a UTF-8 string for base58 decoding
    let base58_str = match String::from_utf8(base64_decoded) {
        Ok(str) => {
            println!("✅ UTF-8 conversion successful: {}", str);
            str
        },
        Err(e) => {
            println!("❌ UTF-8 conversion failed: {}", e);
            return Err(AppError::InvalidAddress);
        }
    };
    
    // Now decode the base58 string
    let bytes = match bs58::decode(&base58_str).into_vec() {
        Ok(b) => {
            println!("✅ Base58 decoding successful, got {} bytes", b.len());
            b
        },
        Err(e) => {
            println!("❌ Base58 decoding failed: {}", e);
            return Err(AppError::InvalidAddress);
        }
    };
    
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

// Handler for creating a memo transaction
pub async fn create_memo_transaction(
    Json(request): Json<TransactionRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // Parse the account address from base58
    let account_pubkey = match bs58::decode(&request.account).into_vec() {
        Ok(bytes) => {
            if bytes.len() != 32 {
                return Err(AppError::InvalidAddress);
            }
            Pubkey::new_from_array(bytes.try_into().unwrap())
        },
        Err(_) => return Err(AppError::InvalidAddress),
    };

    // Create a memo instruction with the user's account as a signer
    let memo_instruction = Instruction {
        program_id: memo_program_id(),
        accounts: vec![
            AccountMeta::new(account_pubkey, true), // true indicates this account is a signer
        ],
        data: "Hello".as_bytes().to_vec(),
    };

    // Use a recent blockhash (all zeros is not valid for actual transactions)
    // In a production environment, you would fetch this from the cluster
    // For this example, we'll use a dummy non-zero hash that the frontend will replace
    let dummy_blockhash = Hash::new_from_array([1; 32]); // Non-zero hash
    
    // Create a V0 message with the dummy blockhash
    let v0_message = v0::Message::try_compile(
        &account_pubkey,
        &[memo_instruction],
        &[],
        dummy_blockhash,
    ).map_err(|_| AppError::SerializationError)?;

    // Get the number of required signatures before moving v0_message
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    
    // Create a versioned message
    let versioned_message = VersionedMessage::V0(v0_message);
    
    // Create a versioned transaction with placeholder signatures for required signers
    // The number of signatures must match the number of required signers in the message
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
    
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Transaction created successfully".to_string(),
    }))
}

// Handler for creating a Confidential Balances associated token account
pub async fn create_cb_ata(
    Json(request): Json<CreateCbAtaRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    println!("🚀 Starting create_cb_ata handler");
    println!("📝 Request data: mint={}, authority={}", request.mint, request.authority);
    
    // Parse the authority address
    println!("🔑 Parsing authority address");
    let token_account_authority = parse_base64_base58_pubkey(&request.authority)?;
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
    let reallocate_instruction = match reallocate(
        &spl_token_2022::id(),
        &token_account_pubkey,                         // Token account
        &token_account_authority,                   // Payer
        &token_account_authority,             // Token account owner
        &[&token_account_authority],          // Signers
        &[ExtensionType::ConfidentialTransferAccount], // Extension to reallocate space for
    ) {
        Ok(instruction) => {
            println!("✅ Reallocate instruction created");
            instruction
        },
        Err(e) => {
            println!("❌ Failed to create reallocate instruction: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };

    // Create the ElGamal keypair and AES key for the sender token account
    println!("🔐 Decoding ElGamal signature: {}", request.elgamal_signature);
    let decoded_elgamal_signature = match BASE64_STANDARD.decode(&request.elgamal_signature) {
        Ok(decoded) => {
            println!("✅ ElGamal signature base64 decoded, got {} bytes", decoded.len());
            decoded
        },
        Err(e) => {
            println!("❌ ElGamal signature base64 decoding failed: {}", e);
            return Err(AppError::SerializationError);
        }
    };
    
    // Create signature directly from bytes
    let elgamal_signature = match Signature::try_from(decoded_elgamal_signature.as_slice()) {
        Ok(sig) => {
            println!("✅ ElGamal signature created successfully");
            sig
        },
        Err(e) => {
            println!("❌ ElGamal signature creation failed: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };
    
    let token_account_authority_elgamal_keypair = match ElGamalKeypair::new_from_signature(&elgamal_signature) {
        Ok(keypair) => {
            println!("✅ ElGamal keypair created successfully");
            keypair
        },
        Err(e) => {
            println!("❌ ElGamal keypair creation failed: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };

    println!("🔐 Decoding AES signature: {}", request.aes_signature);
    let decoded_aes_signature = match BASE64_STANDARD.decode(&request.aes_signature) {
        Ok(decoded) => {
            println!("✅ AES signature base64 decoded, got {} bytes", decoded.len());
            decoded
        },
        Err(e) => {
            println!("❌ AES signature base64 decoding failed: {}", e);
            return Err(AppError::SerializationError);
        }
    };
    
    // Create signature directly from bytes
    let aes_signature = match Signature::try_from(decoded_aes_signature.as_slice()) {
        Ok(sig) => {
            println!("✅ AES signature created successfully");
            sig
        },
        Err(e) => {
            println!("❌ AES signature creation failed: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };
    
    let token_account_authority_aes_key = match AeKey::new_from_signature(&aes_signature) {
        Ok(key) => {
            println!("✅ AES key created successfully");
            key
        },
        Err(e) => {
            println!("❌ AES key creation failed: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };

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
    let proof_data = match PubkeyValidityProofData::new(&token_account_authority_elgamal_keypair) {
        Ok(data) => {
            println!("✅ Pubkey validity proof data generated successfully");
            data
        },
        Err(e) => {
            println!("❌ Failed to generate pubkey validity proof data: {:?}", e);
            return Err(AppError::ProofGeneration);
        }
    };

    // `InstructionOffset` indicates that proof is included in the same transaction
    println!("📍 Setting proof location to InstructionOffset(1)");
    let proof_location = ProofLocation::InstructionOffset(
        1.try_into().unwrap(),
        ProofData::InstructionData(&proof_data),
    );

    // Instructions to configure the token account, including the proof instruction
    println!("📋 Creating configure_account instruction");
    let configure_account_instruction = match configure_account(
        &spl_token_2022::id(),                 // Program ID
        &token_account_pubkey,                 // Token account
        &mint,                        // Mint
        &decryptable_balance.into(),             // Initial balance
        maximum_pending_balance_credit_counter, // Maximum pending balance credit counter
        &token_account_authority,     // Token Account Owner
        &[],                                   // Additional signers
        proof_location,                         // Proof location
    ) {
        Ok(instructions) => {
            println!("✅ Configure account instructions created successfully");
            instructions
        },
        Err(e) => {
            println!("❌ Failed to create configure account instructions: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };

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
    let v0_message = match v0::Message::try_compile(
        &token_account_authority,
        &instructions,
        &[],
        dummy_blockhash,
    ) {
        Ok(message) => {
            println!("✅ V0 message created successfully");
            message
        },
        Err(e) => {
            println!("❌ Failed to create V0 message: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };

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
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => {
            let encoded = BASE64_STANDARD.encode(bytes);
            println!("✅ Transaction serialized successfully, size: {} bytes", encoded.len());
            encoded
        },
        Err(e) => {
            println!("❌ Failed to serialize transaction: {:?}", e);
            return Err(AppError::SerializationError);
        }
    };
    
    println!("🎉 Transaction creation completed successfully");
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Confidential Balances ATA transaction created successfully".to_string(),
    }))
} 