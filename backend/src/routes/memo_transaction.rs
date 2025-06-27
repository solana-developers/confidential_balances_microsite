use {
    crate::{
        errors::AppError,
        models::{TransactionRequest, TransactionResponse},
        routes::util::parse_base58_pubkey,
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode,
    solana_sdk::{
        hash::Hash,
        instruction::{AccountMeta, Instruction},
        message::{v0, VersionedMessage},
        transaction::VersionedTransaction,
    },
    spl_memo::id as memo_program_id,
};

// Handler for creating a memo transaction
pub async fn create_memo_transaction(
    Json(request): Json<TransactionRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // Parse the account address from base58
    let account_pubkey = parse_base58_pubkey(&request.account)?;

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
    let v0_message =
        v0::Message::try_compile(&account_pubkey, &[memo_instruction], &[], dummy_blockhash)
            .map_err(|_| AppError::SerializationError)?;

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
