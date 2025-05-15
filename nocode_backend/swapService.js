const { Connection, Keypair, Transaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const fetch = require('cross-fetch');

const JUPITER_API = 'https://quote-api.jup.ag/v6';

async function getSwapQuote(inputToken, outputToken, amount) {
  const params = new URLSearchParams({
    inputMint: inputToken,
    outputMint: outputToken,
    amount: amount.toString(),
    slippageBps: '50' // 0.5% slippage
  });

  const response = await fetch(`${JUPITER_API}/quote?${params}`);
  return response.json();
}

async function executeSwap(inputToken, outputToken, amount, privateKey) {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const quote = await getSwapQuote(inputToken, outputToken, amount);

  // Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
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
  
  // Sign and send
  const signature = await connection.sendTransaction(transaction, [keypair]);
  return { signature, quote };
}

module.exports = { executeSwap };