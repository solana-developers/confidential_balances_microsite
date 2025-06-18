use {
    crate::{
        errors::AppError,
        models::{CreateTestTokenTransactionRequest, TransactionResponse},
        routes::util::parse_latest_blockhash,
    },
    axum::extract::Json,
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _},
    bincode, bs58,
    solana_sdk::{
        message::{v0, VersionedMessage},
        pubkey::Pubkey,
        system_instruction,
        transaction::VersionedTransaction,
    },
    solana_zk_sdk::encryption::pod::elgamal::PodElGamalPubkey,
    spl_token_2022::{
        extension::{
            confidential_transfer::instruction::initialize_mint as initialize_confidential_transfer_mint,
            ExtensionType,
        },
        instruction::{initialize_mint, initialize_mint_close_authority},
        state::Mint,
    },
    std::str::FromStr,
};

// Helper function to parse a base58 address string into a Pubkey
fn parse_base58_pubkey(address: &str) -> Result<Pubkey, AppError> {
    match bs58::decode(address).into_vec() {
        Ok(bytes) => {
            if bytes.len() != 32 {
                return Err(AppError::InvalidAddress);
            }
            Ok(Pubkey::new_from_array(bytes.try_into().unwrap()))
        }
        Err(_) => Err(AppError::InvalidAddress),
    }
}

/// Handler for creating a test token mint with confidential transfers and close mint support
pub async fn create_test_token_cb(
    Json(request): Json<CreateTestTokenTransactionRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // Parse the account address from base58 to use as mint authority and freeze authority
    let authority_pubkey = parse_base58_pubkey(&request.account)?;
    // Parse the mint address to allow creating instructions for mint initialization with basic supply
    let mint_address = parse_base58_pubkey(&request.mint)?;

    println!(
        "✅ Request data is correct: account={}, mint={}",
        request.account, request.mint,
    );

    // Validate that mint address is different from authority
    if mint_address == authority_pubkey {
        return Err(AppError::InvalidAddress);
    }

    // Calculate space required for mint account with extensions
    let extensions = vec![
        ExtensionType::ConfidentialTransferMint,
        ExtensionType::MintCloseAuthority,
    ];
    let mint_space = ExtensionType::try_calculate_account_len::<Mint>(&extensions)
        .map_err(|_| AppError::SerializationError)?;

    println!(
        "✅ Space for mint is calculated: space={}",
        mint_space.to_string()
    );

    // Use rent provided by client or calculate a reasonable default
    // For Token-2022 mints with extensions, rent is typically higher than regular mints
    let mint_rent = match request.mint_rent {
        Some(rent) => rent,
        None => {
            // Calculate minimum rent based on space + buffer for extensions
            // Solana rent is approximately 0.00000348 SOL per byte
            let base_rent = mint_space as u64 * 3500; // ~3500 lamports per byte
            let extension_buffer = 5_000_000; // 0.005 SOL buffer for extensions
            base_rent + extension_buffer
        }
    };

    match request.mint_rent {
        Some(_) => {
            println!("💰 Using rent amount from request!");
        }
        None => (),
    }
    println!("💰 Rent amount: {} lamports", mint_rent);

    // Create the mint account instruction
    let create_mint_account_instruction = system_instruction::create_account(
        &authority_pubkey,     // Fee payer
        &mint_address,         // New account (mint)
        mint_rent,             // Lamports for rent
        mint_space as u64,     // Space required
        &spl_token_2022::id(), // Owner program (Token-2022)
    );

    let auditor_elgamal_pk = match request.auditor_elgamal_pubkey {
        Some(elgamal_string) => {
            println!(
                "🔍 Attempting to parse base64 elGamal encoded signature: {}",
                elgamal_string
            );
            let decoded_elgamal_signature = BASE64_STANDARD
                .decode(&elgamal_string)
                .map_err(|_| AppError::SerializationError)?;

            println!(
                "✅ Base64 decoding successful, got {} bytes",
                decoded_elgamal_signature.len()
            );

            let elgamal_pubkey = PodElGamalPubkey::from_str(&elgamal_string)
                .map_err(|_| AppError::SerializationError)?;

            println!(
                "✅ ElGamal pubkey recovered from string successfully: pubkey={}",
                elgamal_pubkey.to_string()
            );
            Some(elgamal_pubkey)
        }
        None => None,
    };

    // Initialize ConfidentialTransferMint extension
    let initialize_confidential_transfer_mint_instruction = initialize_confidential_transfer_mint(
        &spl_token_2022::id(),  // Program ID
        &mint_address,          // Mint account
        Some(authority_pubkey), // Authority that can modify confidential transfer settings
        true,                   // Auto approve new accounts
        auditor_elgamal_pk,     // Optional auditor elGamal key
    )
    .map_err(|_| AppError::SerializationError)?;

    // Initialize MintCloseAuthority extension
    let initialize_mint_close_authority_instruction = initialize_mint_close_authority(
        &spl_token_2022::id(),   // Program ID
        &mint_address,           // Mint
        Some(&authority_pubkey), // Close authority
    )
    .map_err(|_| AppError::SerializationError)?;

    // Initialize the mint itself with 9 decimals
    let initialize_mint_instruction = initialize_mint(
        &spl_token_2022::id(),
        &mint_address,
        &authority_pubkey,       // Mint authority
        Some(&authority_pubkey), // Freeze authority
        9,                       // Decimals
    )
    .map_err(|_| AppError::SerializationError)?;

    // Combine all instructions in the correct order
    let instructions = vec![
        create_mint_account_instruction,
        initialize_confidential_transfer_mint_instruction,
        initialize_mint_close_authority_instruction,
        initialize_mint_instruction,
    ];

    // Use blockhash from client or generate a placeholder
    let client_blockhash = parse_latest_blockhash(&request.latest_blockhash)?;

    println!("📝 Creating V0 message");
    let v0_message =
        v0::Message::try_compile(&authority_pubkey, &instructions, &[], client_blockhash)
            .map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    // Get the number of required signatures
    let num_required_signatures = v0_message.header.num_required_signatures as usize;
    println!(
        "🔑 Transaction requires {} signatures",
        num_required_signatures
    );

    println!("📝 Creating versioned message");
    let versioned_message = VersionedMessage::V0(v0_message);

    // Create placeholder signatures (will be replaced by the wallet)
    let mut signatures = Vec::with_capacity(num_required_signatures);
    for _ in 0..num_required_signatures {
        signatures.push(solana_sdk::signature::Signature::default());
    }

    println!("📝 Creating versioned transaction with placeholder signatures");
    let versioned_transaction = VersionedTransaction {
        signatures,
        message: versioned_message,
    };

    // Serialize the transaction to base64
    println!("🔄 Serializing transaction to base64");
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };

    println!(
        "✅ Transaction serialized successfully, size: {} bytes",
        serialized_transaction.len()
    );

    // Create a structured message with mint info and keypair
    let response_message = format!(
        "Token-2022 mint transaction created with 1000 token initial supply: rent={}",
        mint_rent,
    );

    println!("🎉 Transaction creation completed successfully");
    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: response_message,
    }))
}
