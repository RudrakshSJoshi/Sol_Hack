// services/suiService.js
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { fromB64, toB64 } = require('@mysten/sui.js/utils');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { SuiClient } = require('@mysten/sui.js/client');

// Initialize Sui client
const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
});

/**
 * Generate a new Sui wallet
 * @returns {Object} Object containing wallet address and private key
 */
exports.generateSuiWallet = async () => {
  try {
    // Generate a new random Ed25519 keypair
    const keypair = new Ed25519Keypair();
    
    // Get the private key (as base64)
    const privateKeyBase64 = toB64(keypair.export().privateKey);
    
    // Get the public address
    const address = keypair.getPublicKey().toSuiAddress();
    
    return {
      address,
      privateKey: privateKeyBase64
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate wallet: ' + error.message);
  }
};

/**
 * Execute a transfer transaction on Sui blockchain
 * @param {Object} params Transaction parameters
 * @param {string} params.amount Amount to transfer
 * @param {string} params.recipientAddress Recipient address
 * @param {string} params.privateKey Sender's private key (base64)
 * @returns {Object} Transaction result
 */
exports.executeTransaction = async ({ amount, recipientAddress, privateKey }) => {
  try {
    // Recreate the keypair from private key
    const privateKeyBytes = fromB64(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    
    // Get sender address
    const senderAddress = keypair.getPublicKey().toSuiAddress();
    
    // Create a new transaction block
    const tx = new TransactionBlock();
    
    // Split coins if needed, and transfer to recipient
    // You will need to get coins and create the right transaction based on the Sui version and your needs
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    tx.transferObjects([coin], tx.pure(recipientAddress));
    
    // Sign and execute the transaction
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
    });
    
    return {
      success: true,
      transactionId: result.digest,
      details: result
    };
  } catch (error) {
    console.error('Error executing Sui transaction:', error);
    throw new Error('Failed to execute transaction: ' + error.message);
  }
};

/**
 * Get the balance of a Sui wallet
 * @param {string} address Wallet address
 * @returns {Object} Balance information
 */
exports.getBalance = async (address) => {
  try {
    // Get all coins owned by the address
    const { data: coins } = await suiClient.getCoins({
      owner: address
    });
    
    // Calculate total balance
    let totalBalance = 0;
    for (const coin of coins) {
      totalBalance += parseInt(coin.balance);
    }
    
    return {
      totalBalance,
      coins
    };
  } catch (error) {
    console.error('Error fetching Sui balance:', error);
    throw new Error('Failed to fetch balance: ' + error.message);
  }
};

/**
 * Check the status of a transaction
 * @param {string} transactionId Transaction ID (digest)
 * @returns {Object} Transaction status information
 */
exports.checkTransactionStatus = async (transactionId) => {
  try {
    const txData = await suiClient.getTransactionBlock({
      digest: transactionId,
      options: {
        showEffects: true,
        showInput: true,
      },
    });
    
    if (!txData) {
      return {
        status: 'not_found',
        details: null
      };
    }
    
    // Check the transaction status
    const status = txData.effects?.status?.status || 'unknown';
    
    return {
      status,
      details: txData
    };
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw new Error('Failed to check transaction status: ' + error.message);
  }
};