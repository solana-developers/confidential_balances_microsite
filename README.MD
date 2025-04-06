# Confidential Balances Token Extension Reference Implementation

A reference implementation demonstrating the **Confidential Balances token extension** from Solana Program Library's Token22. This project features a Rust backend (Axum) and a React frontend (Next.js).

## Implementation Types

### Trusted Implementation (This Project)
This is a **trusted** implementation that demonstrates UX possibilities using non-custodial wallets. The trust model works as follows:

- The backend receives the user's wallet message signature
- This signature is used as the seed for generating ElGamal & AES encryption keys
- The backend generates zero-knowledge proofs using these keys
- The backend provides partially signed transactions

**Use Cases:**
- Custodial wallet services
- Wallet-as-a-Service (WaaS) providers
- Trusted self-custodial wallets (read security considerations below)

### Trustless Implementation
A trustless implementation would:
- Keep all cryptographic operations within the wallet
- Generate zero-knowledge proofs internally
- Never expose encryption keys to external services

**Current Status:**
- Rust-based wallets: Available now by implementing the [backend](backend) directly into the wallet client.
- TypeScript wallets: Coming soon with the release of the [ElGamal Proof library](https://github.com/solana-program/zk-elgamal-proof/tree/main/clients/js-legacy#solanazk-elgamal-proof)

## ⚠️ Important Security Considerations
Trusted implementations are responsible for generating zkproofs on the backend. Doing so requires access to the user's encryption keys. This sensitive user data must follow proper security hygene, including but not limited to:
- Enforcing HTTPS communication with the backend to ensure encryption seeds are not leaked in-transit.
- No caching of data, especially the keys.
- Deploy the backend in a secure and restricted environment like Google Cloud Run or a secure enclave.


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

## Nuances

- Frontend uses environment variables (`.env.example` provided).
- Backend leverages Axum, Solana SDK, and SPL Token crates. 
