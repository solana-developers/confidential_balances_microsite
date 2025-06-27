use {
    crate::errors::AppError,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bs58,
    solana_sdk::{
        hash::Hash,
        pubkey::{Pubkey, PUBKEY_BYTES},
    },
    std::str::FromStr,
};

// Helper function to parse a base58 address string into a Pubkey
pub fn parse_base58_pubkey(address: &str) -> Result<Pubkey, AppError> {
    match bs58::decode(address).into_vec() {
        Ok(bytes) => {
            if bytes.len() != PUBKEY_BYTES {
                return Err(AppError::InvalidAddress);
            }
            Ok(Pubkey::new_from_array(bytes.try_into().unwrap()))
        }
        Err(_) => Err(AppError::InvalidAddress),
    }
}

// Helper function to parse blockhash bypassed from client
pub fn parse_latest_blockhash(latest_blockhash: &String) -> Result<Hash, AppError> {
    // Parse the provided blockhash from the request
    println!("🔑 Parsing blockhash from request: {}", latest_blockhash);

    let client_blockhash = Hash::from_str(latest_blockhash).map_err(|e| {
        println!("⛔️ Failed to parse blockhash: {}", e);
        AppError::SerializationError
    })?;
    println!("✅ Successfully parsed blockhash: {}", client_blockhash);

    Ok(client_blockhash)
}

// Helper function to parse a base64-encoded base58 address into a Pubkey
pub fn parse_base64_base58_pubkey(encoded_address: &str) -> Result<Pubkey, AppError> {
    println!(
        "🔍 Attempting to parse base64-base58 pubkey: {}",
        encoded_address
    );

    // First, try to decode from base64
    let decoded_base64 = BASE64_STANDARD.decode(encoded_address)?;
    println!(
        "✅ Base64 decoding successful, got {} bytes",
        decoded_base64.len()
    );

    // Then, decode the resulting string as base58
    let decoded_string = String::from_utf8(decoded_base64)?;
    println!("✅ UTF-8 decoding successful: {}", decoded_string);

    // Finally, decode the base58 string to bytes
    let bytes = bs58::decode(&decoded_string).into_vec()?;
    println!("✅ Base58 decoding successful, got {} bytes", bytes.len());

    if bytes.len() != PUBKEY_BYTES {
        println!(
            "⛔️ Invalid pubkey length: expected {} bytes, got {}",
            PUBKEY_BYTES,
            bytes.len()
        );
        return Err(AppError::InvalidAddress);
    }

    // Convert to fixed-size array and create Pubkey
    let bytes_array: [u8; PUBKEY_BYTES] = bytes.try_into().unwrap();
    let pubkey = Pubkey::new_from_array(bytes_array);
    println!("✅ Successfully created Pubkey: {}", pubkey.to_string());

    Ok(pubkey)
}
