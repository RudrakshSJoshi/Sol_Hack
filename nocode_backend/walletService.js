const { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const bs58 = require('bs58');

// Force devnet connection
const network = 'devnet';
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Devnet token addresses
const DEVNET_TOKENS = {
  USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  USDT: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'),
  SUI: new PublicKey('8Yv9Jz4z7BUHP68dzK5AAmUq1qR31PrjqV9VtXqM2GJo')
};

const TOKENS = DEVNET_TOKENS;

function generateWallet() {
  try {
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    const secretKeyBase58 = bs58.encode(keypair.secretKey);
    
    return {
      address,
      publicKey: address,
      keypair: {
        publicKey: Array.from(keypair.publicKey.toBytes()),
        secretKey: Array.from(keypair.secretKey)
      },
      secretKey: Array.from(keypair.secretKey),
      secretKeyBase58: secretKeyBase58
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate wallet: ' + error.message);
  }
}

async function getWalletBalance(address) {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    
    return {
      address: address,
      balanceInSol: balance / LAMPORTS_PER_SOL,
      lamports: balance,
      exists: (await connection.getAccountInfo(publicKey)) !== null
    };
  } catch (error) {
    throw new Error('Failed to fetch balance: ' + error.message);
  }
}

async function getTokenBalances(address) {
  try {
    const publicKey = new PublicKey(address);
    const tokenBalances = {};
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    for (const account of tokenAccounts.value) {
      const mintAddress = account.account.data.parsed.info.mint;
      const balance = account.account.data.parsed.info.tokenAmount;
      
      for (const [name, mint] of Object.entries(TOKENS)) {
        if (mint.toString() === mintAddress) {
          tokenBalances[name] = {
            balance: balance.uiAmount,
            decimals: balance.decimals
          };
        }
      }
    }
    
    return tokenBalances;
  } catch (error) {
    throw new Error('Failed to fetch token balances: ' + error.message);
  }
}

function restoreWallet(secretKeyBase58) {
  try {
    const secretKey = bs58.decode(secretKeyBase58);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    return {
      address: keypair.publicKey.toString(),
      publicKey: keypair.publicKey.toString(),
      secretKeyBase58: secretKeyBase58
    };
  } catch (error) {
    throw new Error('Failed to restore wallet: ' + error.message);
  }
}

module.exports = {
  generateWallet,
  getWalletBalance,
  getTokenBalances,
  restoreWallet,
  connection,
  TOKENS
};