use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
};
use std::fmt;
use solana_program::program_error::ProgramError;
use solana_zk_sdk::errors::ElGamalError;
use solana_sdk::signature::SignerError;

// Error response
#[derive(Debug)]
pub enum AppError {
    InvalidAddress,
    InvalidAmount,
    SerializationError,
    ProofGeneration,
    MintMismatch,
    // Add variants for underlying errors
    TokenError(spl_token_2022::error::TokenError),
    BincodeError(bincode::Error),
    Base64Error(base64::DecodeError),
    Utf8Error(std::string::FromUtf8Error),
    Base58Error(bs58::decode::Error),
    ProgramError(ProgramError),
    ElGamalError(ElGamalError),
    CompileError(solana_message::CompileError),
    SignerError(SignerError),
}

// Implement Display for better error messages
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidAddress => write!(f, "Invalid Solana account address"),
            Self::InvalidAmount => write!(f, "Invalid amount format"),
            Self::SerializationError => write!(f, "Failed to serialize transaction"),
            Self::ProofGeneration => write!(f, "Failed to generate proof"),
            Self::MintMismatch => write!(f, "Sender and recipient token accounts have different mints"),
            Self::TokenError(e) => write!(f, "Token error: {}", e),
            Self::BincodeError(e) => write!(f, "Bincode error: {}", e),
            Self::Base64Error(e) => write!(f, "Base64 decoding error: {}", e),
            Self::Utf8Error(e) => write!(f, "UTF-8 decoding error: {}", e),
            Self::Base58Error(e) => write!(f, "Base58 decoding error: {}", e),
            Self::ProgramError(e) => write!(f, "Solana program error: {}", e),
            Self::ElGamalError(e) => write!(f, "ElGamal encryption error: {}", e),
            Self::CompileError(e) => write!(f, "Compile error: {}", e),
            Self::SignerError(e) => write!(f, "Signer error: {}", e),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            AppError::InvalidAddress | AppError::InvalidAmount | AppError::MintMismatch => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        
        (status, self.to_string()).into_response()
    }
}

// Implement From traits for automatic conversions
impl From<spl_token_2022::error::TokenError> for AppError {
    fn from(error: spl_token_2022::error::TokenError) -> Self {
        Self::TokenError(error)
    }
}

impl From<bincode::Error> for AppError {
    fn from(error: bincode::Error) -> Self {
        Self::BincodeError(error)
    }
}

impl From<base64::DecodeError> for AppError {
    fn from(error: base64::DecodeError) -> Self {
        Self::Base64Error(error)
    }
}

impl From<std::string::FromUtf8Error> for AppError {
    fn from(error: std::string::FromUtf8Error) -> Self {
        Self::Utf8Error(error)
    }
}

impl From<bs58::decode::Error> for AppError {
    fn from(error: bs58::decode::Error) -> Self {
        Self::Base58Error(error)
    }
}

impl From<ProgramError> for AppError {
    fn from(error: ProgramError) -> Self {
        Self::ProgramError(error)
    }
}

impl From<ElGamalError> for AppError {
    fn from(error: ElGamalError) -> Self {
        Self::ElGamalError(error)
    }
} 

impl From<solana_message::CompileError> for AppError {
    fn from(error: solana_message::CompileError) -> Self {
        Self::CompileError(error)
    }
}

impl From<SignerError> for AppError {
    fn from(error: SignerError) -> Self {
        Self::SignerError(error)
    }
}