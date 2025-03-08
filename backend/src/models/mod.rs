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
    pub mint: String,            // The mint address of the token
    pub ata_authority: String,   // The authority address for the confidential balance
    pub elgamal_signature: String, // ElGamal signature as base64 encoded bytes
    pub aes_signature: String,   // AES signature as base64 encoded bytes
}

// Request model for the deposit_cb endpoint
#[derive(Deserialize)]
pub struct DepositCbRequest {
    pub mint: String,            // The mint address of the token
    pub mint_decimals: u8,            // The decimals of the token
    pub ata_authority: String,   // The authority address for the confidential balance
    pub lamport_amount: String,          // The amount to deposit (as a string to handle large numbers)
}

// Request model for the apply_cb endpoint
#[derive(Deserialize)]
pub struct ApplyCbRequest {
    pub ata_authority: String,   // The authority address for the confidential balance
    pub mint: String,            // The mint address of the token
    pub elgamal_signature: String, // ElGamal signature as base64 encoded bytes
    pub aes_signature: String,   // AES signature as base64 encoded bytes
    pub token_account_data: String, // BASE64 encoded account data
}

// Request model for the transfer_cb endpoint
#[derive(Deserialize)]
pub struct TransferCbRequest {
    pub elgamal_signature: String,       //Sender's ElGamal signature as base64 encoded bytes
    pub aes_signature: String,           // Sender's AES signature as base64 encoded bytes
    pub sender_token_account: String,    // The sender's token account info
    pub recipient_token_account: String, // The recipient's token account info
    pub mint_token_account: String,      // The mint token account info
    pub amount: String,                     // The transfer amount as u64
    pub priority_fee: String,             // The priority fee as u64
    pub latest_blockhash: String,         // The latest blockhash
} 