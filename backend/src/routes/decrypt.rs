use {
    crate::{
        errors::AppError,
        models::{DecryptCbRequest, DecryptCbResponse},
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    solana_sdk::signature::Signature,
    solana_zk_sdk::encryption::auth_encryption::AeCiphertext,
    spl_token_2022::{
        extension::{
            confidential_transfer::ConfidentialTransferAccount, BaseStateWithExtensions,
            StateWithExtensionsOwned,
        },
        solana_zk_sdk::encryption::auth_encryption::AeKey,
    },
};

/// Handler for decrypting a Confidential Balance
pub async fn decrypt_cb(
    Json(request): Json<DecryptCbRequest>,
) -> Result<Json<DecryptCbResponse>, AppError> {
    println!("🔐 Starting decrypt_cb handler");

    // Create the AES key
    let aes_key = {
        let decoded_aes_signature = BASE64_STANDARD.decode(&request.aes_signature)?;

        let aes_signature = Signature::try_from(decoded_aes_signature.as_slice())
            .map_err(|_| AppError::SerializationError)?;

        AeKey::new_from_signature(&aes_signature).map_err(|_| AppError::SerializationError)?
    };
    println!("✅ AES key created successfully");

    // Get the token account info
    let token_account_info = {
        // Decode token account data from request instead of fetching it
        let token_account_data = BASE64_STANDARD.decode(&request.token_account_data)?;
        StateWithExtensionsOwned::<spl_token_2022::state::Account>::unpack(token_account_data)?
    };
    println!("🧳 Unpacked token account info");

    let confidential_transfer_account =
        token_account_info.get_extension::<ConfidentialTransferAccount>()?;
    println!("🔍 Fetched confidential transfer account extension");

    let available_balance = confidential_transfer_account.decryptable_available_balance;
    let available_balance =
        AeCiphertext::try_from(available_balance).map_err(|_| AppError::SerializationError)?;
    println!("🔄 Reformatted available balance");
    let decrypted_balance = aes_key
        .decrypt(&available_balance)
        .ok_or(AppError::SerializationError)?;

    println!("✅ Returning decrypted balance");
    Ok(Json(DecryptCbResponse {
        amount: decrypted_balance.to_string(),
        message: "Decryption successful".to_string(),
    }))
}
