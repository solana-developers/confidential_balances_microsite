use axum::{
    routing::{get, post},
    Router,
    http::Method,
};
use std::net::SocketAddr;
use tower_http::{
    trace::TraceLayer,
    cors::{CorsLayer, Any},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Import our modules
mod models;
mod errors;
mod routes;

// Use our route handlers
use routes::{
    health_check,
    hello_world,
    create_memo_transaction,
    create_cb_ata,
    deposit_cb,
    apply_cb,
    transfer_cb,
    withdraw_cb,
    transfer_cb_space,
    withdraw_cb_space,
    decrypt_cb,
};

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
        ]);

    // Build our application with routes
    let app = Router::new()
        .route("/", get(hello_world))
        .route("/health", get(health_check))
        .route("/txn", post(create_memo_transaction))
        .route("/create-cb-ata", post(create_cb_ata))
        .route("/deposit-cb", post(deposit_cb))
        .route("/apply-cb", post(apply_cb))
        .route("/transfer-cb", post(transfer_cb))
        .route("/withdraw-cb", post(withdraw_cb))
        .route("/transfer-cb", get(transfer_cb_space))
        .route("/withdraw-cb", get(withdraw_cb_space))
        .route("/decrypt-cb", post(decrypt_cb))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Get the port from the environment or use a default
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3003);
    
    // Run the server on 0.0.0.0 to accept connections from outside network interfaces
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::debug!("listening on {}", addr);
    
    // In Axum 0.8.x, we use tokio::net::TcpListener instead of axum::Server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("listening on {}", listener.local_addr().unwrap());
    
    axum::serve(listener, app).await.unwrap();
} 