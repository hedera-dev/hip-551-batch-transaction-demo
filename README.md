# Hedera HTS Batch Demo (HIP-551)

This repository demonstrates how to perform an atomic-like Hedera Token Service (HTS) batch transaction using the Hedera JavaScript SDK. The demo covers:

1. Creating three test accounts with automatic token association.
2. Creating an NFT (Luxury Watch) and a fungible token (shares).
3. Batch-minting the NFT, distributing FT shares, pausing FT transfers, and submitting a topic message atomically.

## Prerequisites

- Node.js v14+ and npm
- A Hedera Testnet account (operator) with:
  - Account ID and private key

## Installation

```bash
git clone <repo-url>
cd <repo-directory>
npm install @hashgraph/sdk
npm install dotenv
```

## Configuration

Create a `.env` file in the project root with the following variables:

```bash
OPERATOR_ADDRESS=<Your operator account ID>
OPERATOR_KEY=<Your operator private key>
```

## Running the Demo

```bash
node mintFractionalAsset.js
```

The script will:

1. Create three new test accounts with automatic token association.
2. Create an NFT and a fungible token.
3. Perform a batch transaction that:
   - Mints the NFT.
   - Distributes shares.
   - Pauses transfers.
   - Submits an allocation log via a topic message.
4. Print transaction statuses and the new account IDs to the console.

## Project Structure

- `mintFractionalAsset.js`: Main demo script.
- `accountUtil.js`: Utility for creating test accounts.
- `package.json`: Project metadata and dependencies.
- `.env`: Environment variables (should **not** be committed).

## License

ISC License