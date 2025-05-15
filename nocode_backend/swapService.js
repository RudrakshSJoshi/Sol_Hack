const { Connection, PublicKey, Transaction, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const fetch = require('cross-fetch');
const bs58 = require('bs58');

// Devnet connection
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Devnet token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS',
  SUI: '8Yv9Jz4z7BUHP68dzK5AAmUq1qR31PrjqV9VtXqM2GJo'
};

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

async function getQuote(inputMint, outputMint, amount) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: '50',
    swapMode: 'ExactIn'
  });

  const response = await fetch(`${JUPITER_API_URL}/quote?${params}`);
  return response.json();
}

async function getRealTimePrice(inputToken, outputToken) {
  const response = await fetch(
    `https://price.jup.ag/v4/price?ids=${inputToken}&vsToken=${outputToken}`
  );
  const data = await response.json();
  return data.data[inputToken].price;
}

async function executeSwap({ inputToken, outputToken, amount, keypair }) {
  try {
    const inputMint = TOKENS[inputToken];
    const outputMint = TOKENS[outputToken];
    
    const quote = await getQuote(inputMint, outputMint, amount);
    const swapResponse = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: keypair.publicKey.toString(),
        wrapAndUnwrapSol: true
      })
    });

    const swapData = await swapResponse.json();
    const transaction = Transaction.from(Buffer.from(swapData.swapTransaction, 'base64'));
    
    // Simulate transaction
    const simulation = await connection.simulateTransaction(transaction);
    const priceData = await getRealTimePrice(inputToken, outputToken);

    return {
      success: !simulation.value.err,
      inputAmount: amount,
      outputAmount: Math.floor(amount * priceData),
      priceImpactPct: quote.priceImpactPct,
      transactionData: transaction
    };
  } catch (error) {
    console.error('Swap error:', error);
    throw new Error('Swap simulation failed: ' + error.message);
  }
}

module.exports = {
  executeSwap,
  TOKENS
};