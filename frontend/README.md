# confidential-balances-app

## Start application in dev mode

```sh
pnpm dev
```

## Environment Variables

The application uses environment variables for configuration. Copy the `.env.example` file to create your own `.env` file:

```sh
cp .env.example .env
```

Available environment variables:

- `BACKEND_API_ENDPOINT`: The URL for the backend API

Environment variables are used directly where needed in the code.


## Powered by

<details>

<summary>Expand ↓</summary>

### Usage

Use the [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp) tool to start a new project based
on this template (recommended).

```shell
# created an npm based project
npx create-solana-dapp --template gh:solana-developers/solana-templates/templates/legacy-frontend
# created an pnpm based project
pnpx create-solana-dapp --template gh:solana-developers/solana-templates/templates/legacy-frontend
# created an yarn based project
yarn create solana-dapp --template gh:solana-developers/solana-templates/templates/legacy-frontend
```

### Prerequisites

- Node v18.18.0 or higher

### Manual installation

#### Clone the repo

```shell
git clone https://github.com/solana-developers/solana-templates
cd solana-templates/legacy-frontend
```

#### Install Dependencies

```shell
pnpm install
```

#### Start the web app

```
pnpm dev
```

## Apps

### web

This is a Next.js web app to get you started on interacting with the Solana network.

Start the web app

```shell
pnpm dev
```

Build the web app

```shell
pnpm build
```
</details>
