use {
    crate::{
        errors::AppError,
        models::{AuditTransactionRequest, AuditTransactionResponse},
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode::{self, Options},
    solana_sdk::{
        message::VersionedMessage, signature::Signature, transaction::VersionedTransaction,
    },
    solana_zk_sdk::encryption::elgamal::ElGamalCiphertext,
    spl_token_2022::{
        extension::confidential_transfer::instruction::TransferInstructionData,
        instruction::{decode_instruction_data, TokenInstruction},
        solana_zk_sdk::encryption::elgamal::ElGamalKeypair,
    },
    spl_token_confidential_transfer_proof_generation::TRANSFER_AMOUNT_LO_BITS,
};

/// Handler for auditing Confidential Balance inside the Transfer
pub async fn audit_transaction_cb(
    Json(request): Json<AuditTransactionRequest>,
) -> Result<Json<AuditTransactionResponse>, AppError> {
    println!(
        "Starting audit_transaction handler for transaction: {}",
        request.transaction_signature
    );

    // Decode base64 transaction data
    let transaction_bytes = BASE64_STANDARD
        .decode(&request.transaction_data)
        .map_err(|e| {
            println!("⛔️ Failed to decode base64 transaction data: {:?}", e);
            AppError::Base64Error(e)
        })?;
    println!("Transaction decoded successfully!");

    // Decode ElGamal signature
    println!("Decoding ElGamal signature");
    let elgamal_signature_bytes =
        BASE64_STANDARD
            .decode(&request.elgamal_signature)
            .map_err(|_| {
                println!("Invalid auditor signature format");
                AppError::InvalidAuditorSignature
            })?;

    let auditor_elgamal_keypair = ElGamalKeypair::new_from_signature(
        &Signature::try_from(elgamal_signature_bytes.as_slice())
            .map_err(|_| AppError::InvalidAuditorSignature)?,
    )
    .map_err(|e| {
        println!("⛔️ Failed to create ElGamal keypair: {:?}", e);
        AppError::AuditorAccessDenied
    })?;

    println!("✅ Successfully created auditor's ElGamal keypair");

    // Extract confidential transfer data
    let (ct_lo, ct_hi, sender, recipient, mint) =
        extract_confidential_transfer(&transaction_bytes)?;

    let decrypted_lo = auditor_elgamal_keypair.secret().decrypt(&ct_lo);
    let decrypted_hi = auditor_elgamal_keypair.secret().decrypt(&ct_hi);

    let lo_value = match decrypted_lo.decode_u32() {
        Some(v) => v as u64,
        None => {
            println!("⚠️ Can't decode lo bits");
            return Err(AppError::AmountDecodeError);
        }
    };

    let hi_value = match decrypted_hi.decode_u32() {
        Some(v) => v as u64,
        None => {
            println!("⚠️ Can't decode hi bits");
            return Err(AppError::AmountDecodeError);
        }
    };

    let full_value = hi_value
        .checked_shl(TRANSFER_AMOUNT_LO_BITS as u32)
        .and_then(|hi_shifted| hi_shifted.checked_add(lo_value))
        .ok_or_else(|| {
            println!("⚠️ Full amount overflow");
            AppError::AmountDecodeError
        })?;

    println!("✅ Successfully extracted confidential transfer data");
    println!("📤 Sender: {}", sender);
    println!("📥 Recipient: {}", recipient);
    println!("🪙 Mint: {}", mint);
    println!("💰 Decrypted amount: {}", full_value);

    println!("✅ Successfully audited transaction");
    Ok(Json(AuditTransactionResponse {
        amount: full_value.to_string(),
        sender,
        receiver: recipient,
        message: "Transaction successfully audited".to_string(),
    }))
}

fn extract_confidential_transfer(
    transaction_data: &[u8],
) -> Result<(ElGamalCiphertext, ElGamalCiphertext, String, String, String), AppError> {
    // Deserialize transaction directly from bytes
    let versioned_transaction: VersionedTransaction = bincode::options()
        .with_fixint_encoding()
        .allow_trailing_bytes()
        .deserialize(transaction_data)
        .map_err(|e| {
            println!("⛔️ Failed to deserialize transaction: {:?}", e);
            AppError::SerializationError
        })?;

    // Get V0 message
    let message = match &versioned_transaction.message {
        VersionedMessage::V0(message) => message,
        _ => {
            println!("⚠️ Expected V0 message");
            return Err(AppError::SerializationError);
        }
    };

    // Find confidential transfer instruction by properly deserializing token instructions
    let (transfer_ix_index, transfer_ix) = message
        .instructions
        .iter()
        .enumerate()
        .find(|(_, ix)| {
            let program_id = &message.account_keys[ix.program_id_index as usize];

            // Check if instruction is for token-2022 program
            if program_id != &spl_token_2022::id() {
                return false;
            }

            // Try to deserialize the instruction data
            match TokenInstruction::unpack(&ix.data) {
                Ok(TokenInstruction::ConfidentialTransferExtension) => {
                    println!("🔍 Found ConfidentialTransferExtension instruction");
                    true
                }
                Ok(instruction) => {
                    println!("🔍 Found other token instruction: {:?}", instruction);
                    false
                }
                Err(e) => {
                    println!("⛔️ Failed to deserialize token instruction: {:?}", e);
                    false
                }
            }
        })
        .ok_or_else(|| {
            println!("⛔️ No confidential transfer instruction found");
            AppError::NoConfidentialTransferFound
        })?;

    println!(
        "✅ Found confidential transfer instruction at index {}",
        transfer_ix_index
    );

    // Extract accounts
    let sender = message.account_keys[transfer_ix.accounts[0] as usize].to_string();
    let recipient = message.account_keys[transfer_ix.accounts[1] as usize].to_string();
    let mint = message.account_keys[transfer_ix.accounts[2] as usize].to_string();

    let data = &transfer_ix.data;

    if data.len() < 129 {
        // Need at least 1 + 64 + 64 bytes for discriminator + 2 ciphertexts
        println!("⚠️ Instruction data too short for confidential transfer");
        return Err(AppError::InvalidInstructionData);
    }

    let input = &data[1..];
    let decoded_instruction: TransferInstructionData = *decode_instruction_data(&input)?;
    let ct_pod_lo = decoded_instruction.transfer_amount_auditor_ciphertext_lo;
    let ct_lo = ElGamalCiphertext::try_from(ct_pod_lo)?;
    let ct_pod_hi = decoded_instruction.transfer_amount_auditor_ciphertext_hi;
    let ct_hi = ElGamalCiphertext::try_from(ct_pod_hi)?;

    Ok((ct_lo, ct_hi, sender, recipient, mint))
}
