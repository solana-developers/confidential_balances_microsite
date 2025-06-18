use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use solana_program::program_error::ProgramError;
use solana_sdk::signature::SignerError;
use solana_zk_sdk::errors::ElGamalError;
use std::fmt;

// Error response
#[derive(Debug)]
pub enum AppError {
    InvalidAddress,
    InvalidAmount,
    SerializationError,
    ProofGeneration,
    MintMismatch,
    #[allow(dead_code)]
    InvalidTransactionHash,
    #[allow(dead_code)]
    TransactionFetchError,
    DecryptionError,
    #[allow(dead_code)]
    TransactionDataNotFound,
    #[allow(dead_code)]
    InvalidPublicKey,
    #[allow(dead_code)]
    InvalidPrivateKey,
    #[allow(dead_code)]
    InvalidBlockhash,
    #[allow(dead_code)]
    InstructionCreationError,
    // 401/403 - Access errors
    InvalidAuditorSignature,
    AuditorAccessDenied,
    // 404 - Not Found
    NoConfidentialTransferFound,
    // 422 - Unprocessable Entity
    AmountDecodeError,
    InvalidInstructionData,
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
            // 401/403 - Auditor access errors
            Self::InvalidAuditorSignature => write!(f, "Invalid auditor signature"),
            Self::AuditorAccessDenied => write!(f, "Auditor access denied"),
            // 404 - Not Found
            Self::NoConfidentialTransferFound => write!(f, "No confidential transfer found"),
            // 422 - Unprocessable Entity
            Self::AmountDecodeError => write!(f, "Failed to decode amount"),
            Self::InvalidInstructionData => write!(f, "Invalid instruction data provided"),
            // Other errors
            Self::InvalidAddress => write!(f, "Invalid Solana account address"),
            Self::InvalidAmount => write!(f, "Invalid amount format"),
            Self::SerializationError => write!(f, "Failed to serialize transaction"),
            Self::ProofGeneration => write!(f, "Failed to generate proof"),
            Self::MintMismatch => write!(
                f,
                "Sender and recipient token accounts have different mints"
            ),
            Self::InvalidTransactionHash => write!(f, "Invalid transaction hash/signature format"),
            Self::TransactionFetchError => write!(f, "Failed to fetch transaction data"),
            Self::DecryptionError => write!(f, "Failed to decrypt confidential data"),
            Self::TransactionDataNotFound => write!(f, "Required transaction data not found"),
            Self::InvalidPublicKey => write!(f, "Invalid ElGamal public key format"),
            Self::InvalidPrivateKey => write!(f, "Invalid ElGamal private key format"),
            Self::InvalidBlockhash => write!(f, "Invalid blockhash format"),
            Self::InstructionCreationError => write!(f, "Failed to create instruction"),
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
            AppError::InvalidAddress
            | AppError::Base64Error(_)
            | AppError::SerializationError
            | AppError::InvalidAmount
            | AppError::MintMismatch
            | AppError::InvalidTransactionHash
            | AppError::InvalidPublicKey
            | AppError::InvalidPrivateKey
            | AppError::InvalidBlockhash => StatusCode::BAD_REQUEST,
            AppError::TransactionFetchError | AppError::TransactionDataNotFound => {
                StatusCode::NOT_FOUND
            }
            // 422 -  Unprocessable Entity
            AppError::AmountDecodeError | AppError::InvalidInstructionData => {
                StatusCode::UNPROCESSABLE_ENTITY
            }
            // 401 - Unauthorized
            AppError::InvalidAuditorSignature => StatusCode::UNAUTHORIZED,
            // 403 - Forbidden
            AppError::AuditorAccessDenied => StatusCode::FORBIDDEN,
            // 404 - Not Found
            AppError::NoConfidentialTransferFound => StatusCode::NOT_FOUND,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_error_variants_can_be_constructed() {
        // This test ensures all variants are considered "used"
        let _simple_errors = vec![
            AppError::InvalidTransactionHash,
            AppError::TransactionFetchError,
            AppError::TransactionDataNotFound,
            AppError::InvalidPublicKey,
            AppError::InvalidPrivateKey,
            AppError::InvalidBlockhash,
            AppError::InstructionCreationError,
        ];

        // Test variants with associated data using From traits (most commonly unused ones)
        let _utf8_error: AppError = std::string::String::from_utf8(vec![0x80])
            .unwrap_err()
            .into();
        let _base58_error: AppError = bs58::decode("0OIl").into_vec().unwrap_err().into();

        // NOTE: Other variants like TokenError, BincodeError, etc. are used via From traits
        // or are actively used in the codebase, so they don't need explicit construction here
    }
}
