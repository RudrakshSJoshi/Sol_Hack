const express = require('express');
const wallet = require('./walletService');
const swap = require('./swapService');
const app = express();

app.use(express.json());

// 1. Create Wallet
app.post('/create-wallet', (req, res) => {
  try {
    res.json({ success: true, wallet: wallet.generateWallet() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Check Balances
app.post('/check-balances', async (req, res) => {
  try {
    const balances = await wallet.getBalances(req.body.address);
    res.json({ success: true, balances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Exact Amount Swap (/doswal)
app.post('/doswal', async (req, res) => {
  try {
    const { tokenA, tokenB, amount, privateKey } = req.body;
    const result = await swap.executeSwap(
      wallet.TOKENS[tokenA],
      wallet.TOKENS[tokenB],
      amount,
      privateKey
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Swap All Balance (/swap)
app.post('/swap', async (req, res) => {
  try {
    const { tokenA, tokenB, privateKey } = req.body;
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const balances = await wallet.getBalances(keypair.publicKey.toString());

    // Calculate max swap amount (keep 0.001 SOL for gas)
    let amount;
    if (tokenA === 'SOL') {
      amount = Math.max(0, balances.sol - 0.001);
    } else {
      amount = balances.usdc;
    }

    const result = await swap.executeSwap(
      wallet.TOKENS[tokenA],
      wallet.TOKENS[tokenB],
      amount,
      privateKey
    );

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));