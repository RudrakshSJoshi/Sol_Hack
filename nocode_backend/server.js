const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const walletService = require('./walletService');
const swapService = require('./swapService');
const { Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Devnet Wallet API',
    network: 'devnet'
  });
});

// Generate wallet
app.post('/api/wallet/generate', (req, res) => {
  try {
    const wallet = walletService.generateWallet();
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Airdrop endpoint
app.post('/api/wallet/airdrop', async (req, res) => {
  try {
    const { address, amount = 1 } = req.body;
    const publicKey = new PublicKey(address);
    
    const signature = await walletService.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    
    await walletService.connection.confirmTransaction(signature);
    
    res.json({
      success: true,
      signature,
      message: `${amount} SOL airdropped`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get balance
app.post('/api/wallet/balance', async (req, res) => {
  try {
    const balance = await walletService.getWalletBalance(req.body.address);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get token balances
app.post('/api/wallet/tokenBalances', async (req, res) => {
  try {
    const tokenBalances = await walletService.getTokenBalances(req.body.address);
    res.json({ success: true, tokenBalances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute swap
app.post('/api/swap/execute', async (req, res) => {
  try {
    const { inputToken, outputToken, amount, privateKey } = req.body;
    
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const result = await swapService.executeSwap({
      inputToken,
      outputToken,
      amount,
      keypair
    });

    res.json({
      success: true,
      result: {
        inputAmount: result.inputAmount,
        outputAmount: result.outputAmount,
        priceImpact: result.priceImpactPct,
        transactionData: result.transactionData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supported tokens
app.get('/api/swap/tokens', (req, res) => {
  res.json({
    success: true,
    tokens: Object.keys(walletService.TOKENS)
  });
});

app.listen(PORT, () => {
  console.log(`Server running on devnet - port ${PORT}`);
});