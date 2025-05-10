/*
 * mintFractionalAsset.js
 *
 * Demonstrates an atomic-like HTS batch on the Hedera network:
 * 1. Create three test accounts with automatic token association.
 * 2. Create an NFT (Luxury Watch) and a fungible token (shares).
 * 3. Batch-mint the NFT, distribute FT shares, pause FT transfers, and submit a topic message atomically.
 *
 * Usage:
 *   npm install @hashgraph/sdk dotenv
 *   Create a .env file with:
 *     OPERATOR_ADDRESS=<Your operator account ID>
 *     OPERATOR_KEY=<Your operator private key>
 *   Run: node mintFractionalAsset.js
 */

require('dotenv').config();
const {
  Client,
  BatchTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  TokenPauseTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TransactionReceiptQuery,
  PrivateKey,
  AccountId,
  TokenType,
  TokenSupplyType
} = require('@hashgraph/sdk');
const { createAccountWithHbar } = require('./accountUtil');

async function main() {
  const { OPERATOR_ADDRESS, OPERATOR_KEY } = process.env;
  if (!OPERATOR_ADDRESS || !OPERATOR_KEY) {
    console.error('Missing .env variables. See top of script for instructions.');
    process.exit(1);
  }

  const client = Client.forTestnet();
  // const operatorId = AccountId.fromEvmAddress(0, 0, OPERATOR_ADDRESS);
  const operatorId = await AccountId.fromEvmAddress(0, 0, OPERATOR_ADDRESS).populateAccountNum(client);
  const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
  client.setOperator(operatorId, operatorKey);

  // 1. Create test accounts with auto-association
  console.log('Creating test accounts with auto-association...');
  const alice = await createAccountWithHbar(client);
  const bob = await createAccountWithHbar(client);
  const charlie = await createAccountWithHbar(client);
  const aliceId = alice.accountId;
  const bobId = bob.accountId;
  const charlieId = charlie.accountId;
  console.log(`New accounts: Alice=${aliceId}, Bob=${bobId}, Charlie=${charlieId}`);
  const TOTAL_SHARES = 1000;
  const ALICE_SHARES = 500;
  const BOB_SHARES = 300;
  const CHARLIE_SHARES = 200;

  try {
    // 1. Create NFT token (Luxury Watch)
    console.log('Creating NFT token...');
    const nftCreateResp = await new TokenCreateTransaction()
      .setTokenName('Luxury Watch')
      .setTokenSymbol('LUXNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setTreasuryAccountId(operatorId)
      .setSupplyKey(operatorKey)
      .execute(client);
    const nftCreateReceipt = await nftCreateResp.getReceipt(client);
    const nftTokenId = nftCreateReceipt.tokenId;
    console.log(`NFT Token ID: ${nftTokenId}`);

    // 2. Create FT token (fractional shares)
    console.log('Creating FT token...');
    const ftCreateResp = await new TokenCreateTransaction()
      .setTokenName('Luxury Watch Shares')
      .setTokenSymbol('LUXFT')
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(TOTAL_SHARES)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(TOTAL_SHARES)
      .setTreasuryAccountId(operatorId)
      .setSupplyKey(operatorKey)
      .setPauseKey(operatorKey)
      .execute(client);
    const ftCreateReceipt = await ftCreateResp.getReceipt(client);
    const ftTokenId = ftCreateReceipt.tokenId;
    console.log(`FT Token ID: ${ftTokenId}`);

    // 3. Create topic for logging allocation
    console.log('Creating topic for logging allocation...');
    const topicResp = await new TopicCreateTransaction()
      .setTopicMemo('Fractional Ownership Allocation')
      .execute(client);
    const topicReceipt = await topicResp.getReceipt(client);
    const topicId = topicReceipt.topicId;
    console.log(`Topic ID for allocation log: ${topicId}`);
    const message =
      `Allocated ${ALICE_SHARES}/${TOTAL_SHARES} to Alice, ` +
      `${BOB_SHARES}/${TOTAL_SHARES} to Bob, ` +
      `${CHARLIE_SHARES}/${TOTAL_SHARES} to Charlie`;

    // 4. Batch-mint NFT, distribute FT, and pause FT atomically
    console.log('Submitting batch HTS operations (mint NFT, distribute FT, pause FT)...');
    const mintBatch = await new TokenMintTransaction()
      .setTokenId(nftTokenId)
      .setMetadata([Buffer.from('Luxury Watch #1')])
      .batchify(client, operatorKey);

    const distributeBatch = await new TransferTransaction()
      .addTokenTransfer(ftTokenId, operatorId, -TOTAL_SHARES)
      .addTokenTransfer(ftTokenId, aliceId, ALICE_SHARES)
      .addTokenTransfer(ftTokenId, bobId, BOB_SHARES)
      .addTokenTransfer(ftTokenId, charlieId, CHARLIE_SHARES)
      .batchify(client, operatorKey);

    const pauseBatch = await new TokenPauseTransaction()
      .setTokenId(ftTokenId)
      .batchify(client, operatorKey);

    const messageBatch = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .batchify(client, operatorKey);

    // 5. a) Build batch including logging transaction
    const batchTx = new BatchTransaction()
      .addInnerTransaction(mintBatch)
      .addInnerTransaction(distributeBatch)
      .addInnerTransaction(pauseBatch)
      .addInnerTransaction(messageBatch);

    const batchResp = await batchTx.execute(client);
    const batchReceipt = await batchResp.getReceipt(client);
    console.log(`Batch status: ${batchReceipt.status}`);

    // 5. b) Query individual inner receipts
    console.log('Querying inner transaction receipts...');
    for (const txId of batchTx.innerTransactionIds) {
      const r = await new TransactionReceiptQuery()
        .setTransactionId(txId)
        .execute(client);
      console.log(` - Inner tx ${txId.toString()}: status=${r.status}`);
    }

    console.log('Demo complete. All operations (batched) succeeded.');
  } catch (error) {
    console.error('Error encountered:', error);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
