# Confidential Balances Token Extension Reference Implementation

A reference implementation demonstrating the **Confidential Balances token extension** from Solana Program Library's Token22. This project features a Rust backend (Axum) and a React frontend (Next.js).

## Target Audience

This reference implementation is designed for:
- **Custodial wallet services**
- **Wallet-as-a-Service (WaaS) providers**

## ⚠️ Important Security Considerations

This implementation should **not** be used for building self-custodial wallets. Here's why:

1. The current architecture requires users to expose encryption key seeds (ElGamal & AES) to the backend
2. For proper security in self-custodial scenarios, cryptographic operations should remain within a secure enclave or client-side environment
3. The **ZK ElGamal Proof library** (responsible for generating zero-knowledge proofs for account creation, deposits, transfers, and withdrawals) is still under development for TypeScript

Currently, truly secure implementations are only possible with pure-Rust frontends, which are uncommon in the wallet ecosystem.

Developers interested in self-custodial implementations can track the progress of the TypeScript library here:
[https://github.com/solana-program/zk-elgamal-proof/tree/main/clients/js-legacy#solanazk-elgamal-proof](https://github.com/solana-program/zk-elgamal-proof/tree/main/clients/js-legacy#solanazk-elgamal-proof)

Despite these limitations, this implementation serves as a valuable educational resource for understanding Confidential Balances while more comprehensive TypeScript libraries are being developed.

For additional insights, check out the following additional resources:
- [Token extensions docs](https://solana.com/docs/tokens/extensions)
- [Confidential Balances Cookbook](https://github.com/solana-developers/Confidential-Balances-Sample/tree/main)
  - Additional Rust examples
  - Product guide

## Live Demo
Check out the deployed version here: https://confidential-balances-microsite-peach.vercel.app

## Quick Start

### Backend

```bash
cd backend
cargo run
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

## Deployment

Update `frontend/.env`:

```env
NEXT_PUBLIC_BACKEND_API_ENDPOINT=https://your-hosted-backend-url.com
```

Ensure backend is accessible at this URL.

## Solana Cluster Configuration

Changing clusters requires updating both frontend settings and your browser wallet (e.g., Phantom, Solflare).

## Nuances

- Frontend uses environment variables (`.env.example` provided).
- Backend leverages Axum, Solana SDK, and SPL Token crates. 
