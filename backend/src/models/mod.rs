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