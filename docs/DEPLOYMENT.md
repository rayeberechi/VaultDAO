# Deployment Guide

This guide provides instructions for building and deploying VaultDAO to the Stellar Testnet and Mainnet.

## Prerequisites

- **Stellar CLI**: [Installation Guide](https://developers.stellar.org/docs/tools/developer-tools)
- **Rust & WASM Target**: `rustup target add wasm32-unknown-unknown`
- **Testnet Account**: Created via the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=testnet).

## 1. Smart Contract Deployment

### Build the WASM

```bash
cd contracts/vault
cargo build --target wasm32-unknown-unknown --release
```

The optimized WASM will be located at `target/wasm32-unknown-unknown/release/vault_dao.wasm`.

### Deploy to Testnet

```bash
# 1. Install the WASM (returns WASM ID)
WASM_ID=$(stellar contract install --network testnet --source <YOUR_SECRET_KEY> --wasm target/wasm32-unknown-unknown/release/vault_dao.wasm)

# 2. Instantiate the Contract (returns CONTRACT ID)
CONTRACT_ID=$(stellar contract deploy --wasm-hash $WASM_ID --network testnet --source <YOUR_SECRET_KEY>)

echo "Deployed Contract ID: $CONTRACT_ID"
```

### Initialize the Vault

The vault must be initialized before it can be used.

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- \
  initialize \
  --admin <ADMIN_ADDRESS> \
  --signers '["<SIGNER_1>", "<SIGNER_2>"]' \
  --threshold 2 \
  --spending_limit 10000000 \
  --daily_limit 50000000 \
  --weekly_limit 200000000 \
  --timelock_threshold 1000000 \
  --timelock_delay 2000
```

## 2. Frontend Configuration

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_CONTRACT_ID=<YOUR_DEPLOYED_CONTRACT_ID>
VITE_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

### Start Development Server

```bash
cd frontend
npm install
npm run dev
```

## 3. Deployment Checklist

- [ ] **Optimization**: Ensure `--release` flag was used during build.
- [ ] **Initialization**: Verify `initialize` was called with correct parameters.
- [ ] **WASM ID**: Keep a record of the WASM ID for future upgrades.
- [ ] **Contract ID**: Update frontend environment variables.
- [ ] **Asset Links**: Ensure the contract is funded with relevant tokens (e.g., XLM) for testing.

## Troubleshooting

- **Insufficient Funds**: Ensure your deployer account has enough XLM for the transaction fees and ledger rent.
- **Already Initialized**: The `initialize` function can only be called once. If you need to change settings, use the governance functions (multi-sig required).
- **WASM Memory Limits**: Soroban has strict limits. If your build fails, check the `Cargo.toml` optimization profiles.
