/**
 * accountUtil.js
 *
 * Utility function to create a Hedera test account with auto-association.
 */

const {
  AccountCreateTransaction,
  Hbar,
  PrivateKey
} = require('@hashgraph/sdk');

/**
 * Creates a new Hedera account with a generated key, initial HBAR balance,
 * and a set number of automatic token associations.
 *
 * @param {Client} client - Hedera client with operator credentials.
 * @param {Hbar} [initialBalance=new Hbar(10)] - Initial HBAR balance.
 * @param {number} [maxAutomaticTokenAssociations=1] - Auto-association slots.
 * @returns {Promise<{accountId: import('@hashgraph/sdk').AccountId, privateKey: import('@hashgraph/sdk').PrivateKey}>}
 */
async function createAccountWithHbar(
  client,
  initialBalance = new Hbar(10),
  maxAutomaticTokenAssociations = 1
) {
  const newKey = PrivateKey.generate();
  const resp = await new AccountCreateTransaction()
    .setKey(newKey)
    .setInitialBalance(initialBalance)
    .setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociations)
    .execute(client);
  const receipt = await resp.getReceipt(client);
  return { accountId: receipt.accountId, privateKey: newKey };
}

module.exports = { createAccountWithHbar };