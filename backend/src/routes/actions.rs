use axum::extract::Json;
use serde_json::json;
use std::collections::HashMap;
use crate::models::{ActionMetadata, ActionInput};

// Get actions JSON endpoint
pub async fn get_actions_json() -> Json<serde_json::Value> {
    Json(json!({
        "actions": [
            {
                "name": "memo",
                "label": "Create Memo",
                "description": "Create a transaction with a memo saying 'Hello'",
                "icon": "💬",
            }
        ]
    }))
}

// Get action metadata endpoint
pub async fn get_action_metadata() -> Json<ActionMetadata> {
    let mut validations = HashMap::new();
    validations.insert("required".to_string(), json!(true));
    
    Json(ActionMetadata {
        name: "memo".to_string(),
        description: "Create a transaction with a memo saying 'Hello'".to_string(),
        icon: "💬".to_string(),
        label: "Create Memo".to_string(),
        required_inputs: vec![
            ActionInput {
                name: "account".to_string(),
                label: "Account".to_string(),
                kind: "pubkey".to_string(),
                validations,
            }
        ],
        post_ui_action: Some("sign".to_string()),
    })
} 