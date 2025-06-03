use axum::extract::Json;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use bincode;
use bs58;
use solana_sdk::{
    hash::Hash,
    message::{v0, VersionedMessage},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_instruction,
    transaction::VersionedTransaction,
};
use spl_associated_token_account::{
    get_associated_token_address_with_program_id, instruction::create_associated_token_account,
};
use spl_token_2022::{
    extension::{
        confidential_transfer::instruction::initialize_mint as initialize_confidential_transfer_mint,
        ExtensionType,
    },
    instruction::{initialize_mint, initialize_mint_close_authority, mint_to},
    state::Mint,
};

use crate::errors::AppError;
use crate::models::{CreateTestTokenTransactionRequest, TransactionResponse};

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

// Handler for creating a test token mint with confidential transfers and close mint support
pub async fn create_test_token(
    Json(request): Json<CreateTestTokenTransactionRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // Parse the account address from base58 to use as mint authority and freeze authority
    let authority_pubkey = parse_base58_pubkey(&request.account)?;
    // Parse the mint address to allow creating instructions for mint initialization and basic supply
    let mint_address = parse_base58_pubkey(&request.mint)?;

    println!(
        ":mark: Request data is correct: account={}",
        request.account
    );

    let random_pair = Keypair::new();

    println!(
        ":mark: Generate mint address for new mint: mint={}",
        mint_address.to_string()
    );

    // Calculate space required for mint account with extensions
    let extensions = vec![
        ExtensionType::ConfidentialTransferMint,
        ExtensionType::MintCloseAuthority,
    ];
    let mint_space = ExtensionType::try_calculate_account_len::<Mint>(&extensions)
        .map_err(|_| AppError::SerializationError)?;

    println!(
        ":mark: Space for mint is calculated: space={}",
        mint_space.to_string()
    );

    // Use a hardcoded rent amount for the mint account (will be adjusted by frontend)
    // In production, this would be calculated dynamically
    let mint_rent = 10_000_000; // 0.01 SOL should be sufficient for most mint accounts

    // Create the mint account instruction
    let create_mint_account_instruction = system_instruction::create_account(
        &authority_pubkey,     // Fee payer
        &mint_address,         // New account (mint)
        mint_rent,             // Lamports for rent
        mint_space as u64,     // Space required
        &spl_token_2022::id(), // Owner program (Token-2022)
    );

    // Get the associated token account for the authority
    let authority_token_account = get_associated_token_address_with_program_id(
        &authority_pubkey, // Authority
        &mint_address,     // Mint
        &spl_token_2022::id(),
    );

    // Create associated token account instruction
    let create_ata_instruction = create_associated_token_account(
        &authority_pubkey,     // Funding account
        &authority_pubkey,     // Wallet address
        &mint_address,         // Mint address
        &spl_token_2022::id(), // Token program ID
    );

    // Initialize ConfidentialTransferMint extension
    let initialize_confidential_transfer_mint_instruction = initialize_confidential_transfer_mint(
        &spl_token_2022::id(),  // Program ID
        &mint_address,          // Mint account
        Some(authority_pubkey), // Authority that can modify confidential transfer settings
        true,                   // Auto approve new accounts
        None,                   // No auditor ElGamal pubkey
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

    // Mint initial supply (default 1000 tokens = 1000 * 10^9 = 1_000_000_000_000 lamports)
    let initial_supply = 1000_u64 * 10_u64.pow(9); // 1000 tokens with 9 decimals
    let mint_supply_instruction = mint_to(
        &spl_token_2022::id(),    // Token program ID
        &mint_address,            // Mint account
        &authority_token_account, // Destination token account
        &authority_pubkey,        // Mint authority
        &[&authority_pubkey],     // Signers
        initial_supply,           // Amount to mint
    )
    .map_err(|_| AppError::SerializationError)?;

    println!(
        "💰 Will mint {} tokens ({} lamports) to authority ATA: {}",
        1000, initial_supply, authority_token_account
    );

    // Combine all instructions in the correct order
    let instructions = vec![
        create_mint_account_instruction,
        initialize_confidential_transfer_mint_instruction,
        initialize_mint_close_authority_instruction,
        initialize_mint_instruction,
        create_ata_instruction,
        mint_supply_instruction,
    ];

    // Use a dummy blockhash (will be replaced by frontend)
    let dummy_blockhash = Hash::new_from_array([1; 32]);

    println!("📝 Creating V0 message");
    let v0_message =
        v0::Message::try_compile(&authority_pubkey, &instructions, &[], dummy_blockhash)
            .map_err(|_| AppError::SerializationError)?;
    println!("✅ V0 message created successfully");

    // Note: Since we're using a random keypair for the mint account,
    // the frontend will need both the transaction AND the mint keypair to sign.
    // This means we need to return the mint keypair's secret key to the frontend
    // or use a different approach like PDA-based mint creation.

    // Get the number of required signatures
    let num_required_signatures = v0_message.header.num_required_signatures as usize;

    // Create a versioned message
    let versioned_message = VersionedMessage::V0(v0_message);

    // Create placeholder signatures (will be replaced by the wallet)
    let mut signatures = Vec::with_capacity(num_required_signatures);
    for _ in 0..num_required_signatures {
        signatures.push(solana_sdk::signature::Signature::default());
    }

    let versioned_transaction = VersionedTransaction {
        signatures,
        message: versioned_message,
    };

    // Serialize the transaction to base64
    let serialized_transaction = match bincode::serialize(&versioned_transaction) {
        Ok(bytes) => BASE64_STANDARD.encode(bytes),
        Err(_) => return Err(AppError::SerializationError),
    };

    // Create a structured message with mint info and keypair
    let response_message = format!(
        "{{\"status\":\"success\",\"mint_address\":\"{}\",\"authority_ata\":\"{}\",\"initial_supply\":1000,\"info\":\"Token-2022 mint transaction created with 1000 token initial supply. Frontend must sign with authority account AND import and sign with the provided mint_keypair.\"}}",
        random_pair.pubkey().to_string(),
        authority_token_account.to_string(),
    );

    Ok(Json(TransactionResponse {
        transaction: serialized_transaction,
        message: response_message,
    }))
}
