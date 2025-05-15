const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const bs58 = require('bs58');

// Mainnet connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};

function generateWallet() {
  const keypair = Keypair.generate();
  return {
    address: keypair.publicKey.toString(),
    privateKey: bs58.encode(keypair.secretKey)
  };
}

async function getBalances(address) {
  const publicKey = new PublicKey(address);
  
  // SOL balance
  const solBalance = await connection.getBalance(publicKey);
  
  // USDC balance
  const usdcAddress = await getAssociatedTokenAddress(
    new PublicKey(TOKENS.USDC),
    publicKey
  );
  const usdcBalance = await connection.getTokenAccountBalance(usdcAddress)
    .catch(() => ({ value: { uiAmount: 0 } }));

  return {
    sol: solBalance / LAMPORTS_PER_SOL,
    usdc: usdcBalance.value.uiAmount || 0
  };
}

module.exports = { generateWallet, getBalances, TOKENS };