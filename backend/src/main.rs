use axum::{
    routing::{get, post},
    Router,
    extract::{Json, Query},
    http::{StatusCode, Method, HeaderValue},
    response::{IntoResponse, Response},
};
use std::net::SocketAddr;
use tower_http::{
    trace::TraceLayer,
    cors::{CorsLayer, Any},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use serde::{Deserialize, Serialize};
use solana_sdk::{
    pubkey::Pubkey,
    transaction::{Transaction, VersionedTransaction},
    message::{Message, VersionedMessage, v0},
    instruction::Instruction,
    system_program,
    hash::Hash,
    signature::Keypair,
};
use spl_memo::id as memo_program_id;
use bs58;
use bincode;
use std::collections::HashMap;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "axum_hello_world=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Configure CORS for Solana Actions
    // According to the Dialect Blinks specification
    let cors = CorsLayer::new()
        // Allow requests from any origin
        .allow_origin(Any)
        // Allow specific HTTP methods
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::OPTIONS])
        // Allow specific headers
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT_ENCODING,
            axum::http::header::CONTENT_ENCODING,
        ]);

    // Build our application with a route
    let app = Router::new()
        .route("/", get(hello_world))
        .route("/health", get(health_check))
        .route("/txn", get(get_action_metadata).post(create_memo_transaction))
        .route("/actions.json", get(get_actions_json))
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("listening on {}", addr);
    
    // In Axum 0.8.x, we use tokio::net::TcpListener instead of axum::Server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("listening on {}", listener.local_addr().unwrap());
    
    axum::serve(listener, app).await.unwrap();
}

// Handler for the root path that returns a hello world message
async fn hello_world() -> &'static str {
    "Hello, World!"
}

// Health check endpoint
async fn health_check() -> &'static str {
    "OK"
}

// Handler for actions.json
async fn get_actions_json() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "rules": [
            {
                "pathPattern": "/txn",
                "apiPath": "/txn"
            }
        ]
    }))
}

// Solana Actions metadata response
#[derive(Serialize)]
struct ActionMetadata {
    name: String,
    description: String,
    icon: String,
    label: String,
    #[serde(rename = "requiredInputs")]
    required_inputs: Vec<ActionInput>,
    #[serde(rename = "postUiAction")]
    post_ui_action: Option<String>,
}

#[derive(Serialize)]
struct ActionInput {
    name: String,
    label: String,
    kind: String,
    #[serde(rename = "validations")]
    validations: HashMap<String, serde_json::Value>,
}

// Handler for GET /txn - Returns the Solana Actions metadata
async fn get_action_metadata() -> Json<ActionMetadata> {
    let mut validations = HashMap::new();
    validations.insert("required".to_string(), serde_json::Value::Bool(true));
    
    Json(ActionMetadata {
        name: "Memo Action".to_string(),
        description: "Create a transaction with a memo saying 'Hello'".to_string(),
        icon: "https://solana.com/favicon.ico".to_string(), // Example icon URL
        label: "Create Memo".to_string(),
        required_inputs: vec![
            ActionInput {
                name: "account".to_string(),
                label: "Solana Account".to_string(),
                kind: "pubkey".to_string(),
                validations,
            },
        ],
        post_ui_action: Some("sign".to_string()),
    })
}

// Request model for the transaction endpoint
#[derive(Deserialize)]
struct TransactionRequest {
    account: String,
}

// Response model for the transaction endpoint
#[derive(Serialize)]
struct TransactionResponse {
    transaction: String,
    message: String,
}

// Error response
enum AppError {
    InvalidAddress,
    SerializationError,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::InvalidAddress => (
                StatusCode::BAD_REQUEST,
                "Invalid Solana account address".to_string(),
            ).into_response(),
            AppError::SerializationError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to serialize transaction".to_string(),
            ).into_response(),
        }
    }
}

// Handler for creating a memo transaction
async fn create_memo_transaction(
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

    // Create a memo instruction
    let memo_instruction = Instruction {
        program_id: memo_program_id(),
        accounts: vec![],
        data: "Hello".as_bytes().to_vec(),
    };

    // Create a V0 message
    let v0_message = v0::Message::try_compile(
        &account_pubkey,
        &[memo_instruction],
        &[],
        Hash::default(),
    ).map_err(|_| AppError::SerializationError)?;

    // Create a versioned message
    let versioned_message = VersionedMessage::V0(v0_message);
    
    // Create a versioned transaction with an empty signers array
    // Use an empty Vec instead of an empty array to avoid type inference issues
    let versioned_transaction = VersionedTransaction {
        signatures: vec![],
        message: versioned_message,
    };
    
    // Serialize the transaction to base58
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => bs58::encode(bytes).into_string(),
        Err(_) => return Err(AppError::SerializationError),
    };
    
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: "Transaction created successfully".to_string(),
    }))
} 