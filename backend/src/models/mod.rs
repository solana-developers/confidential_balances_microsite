use serde::{Deserialize, Serialize};

// Request model for the transaction endpoint
#[derive(Deserialize)]
pub struct TransactionRequest {
    pub account: String,
}

// Response model for the transaction endpoint
#[derive(Serialize)]
pub struct TransactionResponse {
    pub transaction: String,
    pub message: String,
}

// Response model for the multi-transaction endpoint
#[derive(Serialize)]
pub struct MultiTransactionResponse {
    pub transactions: Vec<String>,
    pub message: String,
}

// Request model for the create_cb_ata endpoint (cb = Confidential Balances)
#[derive(Deserialize)]
pub struct CreateCbAtaRequest {
    pub mint: String,              // The mint address of the token
    pub ata_authority: String,     // The authority address for the confidential balance
    pub elgamal_signature: String, // ElGamal signature as base64 encoded bytes
    pub aes_signature: String,     // AES signature as base64 encoded bytes
    pub latest_blockhash: String,  // The latest blockhash
}

// Request model for the deposit_cb endpoint
#[derive(Deserialize)]
pub struct DepositCbRequest {
    pub token_account_data: String, // BASE64 encoded account data
    pub lamport_amount: String,     // The amount to deposit (as a string to handle large numbers)
    pub mint_decimals: u8,          // The number of decimals for the mint
    pub latest_blockhash: String,   // The latest blockhash
}

// Request model for the apply_cb endpoint
#[derive(Deserialize)]
pub struct ApplyCbRequest {
    pub ata_authority: String, // The authority address for the confidential balance
    pub elgamal_signature: String, // ElGamal signature as base64 encoded bytes
    pub aes_signature: String, // AES signature as base64 encoded bytes
    pub token_account_data: String, // BASE64 encoded account data
    pub latest_blockhash: String, // The latest blockhash
}

// Request model for the transfer_cb endpoint
#[derive(Deserialize)]
pub struct TransferCbRequest {
    pub elgamal_signature: String, //Sender's ElGamal signature as base64 encoded bytes
    pub aes_signature: String,     // Sender's AES signature as base64 encoded bytes
    pub sender_token_account: String, // The sender's token account info
    pub recipient_token_account: String, // The recipient's token account info
    pub mint_token_account: String, // The mint token account info
    pub amount: String,            // The transfer amount as u64
    pub priority_fee: String,      // The priority fee as u64
    pub latest_blockhash: String,  // The latest blockhash
    pub equality_proof_rent: String, // Rent for equality proof context state account
    pub ciphertext_validity_proof_rent: String, // Rent for ciphertext validity proof context state account
    pub range_proof_rent: String,               // Rent for range proof context state account
}

// Request model for the withdraw_cb endpoint
#[derive(Deserialize)]
pub struct WithdrawCbRequest {
    pub elgamal_signature: String, // ElGamal signature as base64 encoded bytes
    pub aes_signature: String,     // AES signature as base64 encoded bytes
    pub recipient_token_account: String, // The recipient's token account info
    pub mint_account_info: String, // The mint account info
    pub withdraw_amount_lamports: String, // The amount to withdraw as u64
    pub latest_blockhash: String,  // The latest blockhash
    pub equality_proof_rent: String, // Rent for equality proof context state account
    pub range_proof_rent: String,  // Rent for range proof context state account
}

// Response model for the transfer-cb GET endpoint providing space requirements
#[derive(Serialize)]
pub struct TransferCbSpaceResponse {
    pub equality_proof_space: usize,
    pub ciphertext_validity_proof_space: usize,
    pub range_proof_space: usize,
    pub message: String,
}

// Response model for the withdraw-cb GET endpoint providing space requirements
#[derive(Serialize)]
pub struct WithdrawCbSpaceResponse {
    pub equality_proof_space: usize,
    pub range_proof_space: usize,
    pub message: String,
}

// Request model for the decrypt_cb endpoint
#[derive(Deserialize)]
pub struct DecryptCbRequest {
    pub aes_signature: String,      // AES signature as base64 encoded bytes
    pub token_account_data: String, // BASE64 encoded account data
}

// Response model for the decrypt_cb endpoint
#[derive(Serialize)]
pub struct DecryptCbResponse {
    pub amount: String,
    pub message: String,
}

// Request model for the create_test_token endpoint
#[derive(Deserialize)]
pub struct CreateTestTokenTransactionRequest {
    pub account: String,
    pub mint: String,
    pub latest_blockhash: String,               // The latest blockhash
    pub mint_rent: Option<u64>,                 // Optional rent amount for mint account
    pub auditor_elgamal_pubkey: Option<String>, // Optional ElGamal key for auditor
}

// Request model for auditing a transaction
#[derive(Deserialize)]
pub struct AuditTransactionRequest {
    pub transaction_signature: String, // BASE64 encoded signature
    pub transaction_data: String,      // BASE64 encoded data for transaction
    pub elgamal_signature: String,     // BASE64 encoded ElGamal signature
}

// Response model for auditing a transaction
#[derive(Serialize)]
pub struct AuditTransactionResponse {
    pub amount: String,   // Full amount of the Transfer
    pub mint: String,     // Mint address
    pub sender: String,   // Transfer's sender
    pub receiver: String, // Transfer's receiver
    pub message: String,
}

// Request model for revealing ElGamal public key
#[derive(Deserialize)]
pub struct RevealElGamalPubkeyRequest {
    pub elgamal_signature: String, // BASE64 encoded ElGamal signature
}

// Response model for revealing ElGamal public key
#[derive(Serialize)]
pub struct RevealElGamalPubkeyResponse {
    pub pubkey: String, // ElGamal public key as string
    pub message: String,
}
