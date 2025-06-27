use {
    crate::{errors::AppError, models::WithdrawCbSpaceResponse},
    axum::extract::Json,
    solana_zk_sdk::zk_elgamal_proof_program,
    std::mem::size_of,
};

/// GET handler to provide space requirements for withdraw-cb operation
pub async fn withdraw_cb_space() -> Result<Json<WithdrawCbSpaceResponse>, AppError> {
    println!("📊 Processing withdraw-cb-space request");

    let equality_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::ciphertext_commitment_equality::CiphertextCommitmentEqualityProofContext
    >>();

    let range_proof_space = size_of::<zk_elgamal_proof_program::state::ProofContextState<
        solana_zk_sdk::zk_elgamal_proof_program::proof_data::batched_range_proof::batched_range_proof_u128::BatchedRangeProofU128Data
    >>();

    Ok(Json(WithdrawCbSpaceResponse {
        equality_proof_space,
        range_proof_space,
        message: "Space requirements for withdraw-cb proofs".to_string(),
    }))
}
