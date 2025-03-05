use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

// Action metadata models
#[derive(Serialize)]
pub struct ActionMetadata {
    pub name: String,
    pub description: String,
    pub icon: String,
    pub label: String,
    #[serde(rename = "requiredInputs")]
    pub required_inputs: Vec<ActionInput>,
    #[serde(rename = "postUiAction")]
    pub post_ui_action: Option<String>,
}

#[derive(Serialize)]
pub struct ActionInput {
    pub name: String,
    pub label: String,
    pub kind: String,
    #[serde(rename = "validations")]
    pub validations: HashMap<String, serde_json::Value>,
} 