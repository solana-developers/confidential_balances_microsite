use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
};

// Error response
#[derive(Debug)]
pub enum AppError {
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