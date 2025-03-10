# Confidential Balances Token Extension Reference Implementation

This repository demonstrates the **Confidential Balances token extension** from Solana Program Library's Token22, featuring a Rust backend (Axum) and a React frontend (Next.js).

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
- Backend leverages Axum, Solana SDK, and SPL Token libraries. 