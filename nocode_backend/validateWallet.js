// validateWallet.js
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const bs58 = require('bs58');

// Initialize connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
  'confirmed'
);

/**
 * Validate a Solana wallet address
 * @param {string} address - The wallet address to validate
 */
async function validateWallet(address) {
  console.log("\n========== WALLET VALIDATION ==========");
  console.log("Address to check:", address);
  
  try {
    // Check if the address is a valid public key
    const publicKey = new PublicKey(address);
    console.log("✅ Valid Public Key format");
    
    // Check if the account exists
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (accountInfo) {
      console.log("✅ Account exists on-chain");
      console.log("Owner program:", accountInfo.owner.toString());
      console.log("Data size:", accountInfo.data.length, "bytes");
      console.log("Executable:", accountInfo.executable);
      
      if (accountInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        console.log("⚠️ WARNING: This is a TOKEN ACCOUNT, not a main wallet");
        console.log("Cannot receive direct SOL transfers!");
      } else if (accountInfo.owner.toString() === '11111111111111111111111111111111') {
        console.log("✅ This is a MAIN ACCOUNT, can receive SOL transfers");
      } else {
        console.log("⚠️ This is a PROGRAM-OWNED ACCOUNT, may have restrictions");
      }
    } else {
      console.log("ℹ️ Account does not exist on-chain yet (will be created on first transfer)");
    }
    
    // Check balance
    const balance = await connection.getBalance(publicKey);
    console.log("Current balance:", balance / 1e9, "SOL");
    
  } catch (error) {
    console.error("❌ Invalid address:", error.message);
  }
  
  console.log("=======================================\n");
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  validateWallet(args[0]);
} else {
  console.log("Please provide a wallet address to validate");
  console.log("Example: node validateWallet.js HN7cJuhYqU4HPg6pgibHfLfPsBgJxKxgWjqTXzzYi2QP");
}

module.exports = { validateWallet };