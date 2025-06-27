use {
    crate::{errors::AppError, models::TransferCbSpaceResponse},
    axum::extract::Json,
    solana_zk_sdk::zk_elgamal_proof_program,
    std::mem::size_of,
};

/// GET handler to provide space requirements for transfer-cb operation
pub async fn transfer_cb_space() -> Result<Json<TransferCbSpaceResponse>, AppError> {
    println!("📊 Processing transfer-cb-space request");

    let equality_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::ciphertext_commitment_equality::CiphertextCommitmentEqualityProofContext
    >>();

    let ciphertext_validity_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_grouped_ciphertext_validity::BatchedGroupedCiphertext3HandlesValidityProofContext
    >>();

    let range_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_range_proof::batched_range_proof_u128::BatchedRangeProofU128Data
    >>();

    Ok(Json(TransferCbSpaceResponse {
        equality_proof_space,
        ciphertext_validity_proof_space,
        range_proof_space,
        message: "Space requirements for transfer-cb proofs".to_string(),
    }))
}
