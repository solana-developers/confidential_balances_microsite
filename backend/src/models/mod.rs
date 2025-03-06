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