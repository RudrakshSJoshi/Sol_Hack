// Solana Trading Server with Real Mainnet Transactions
const express = require('express');
const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  clusterApiUrl
} = require('@solana/web3.js');
const {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} = require('@solana/spl-token');
const bs58 = require('bs58');
const axios = require('axios');
const cors = require('cors');
const { Jupiter } = require('@jup-ag/core');
const JSBI = require('jsbi'); // Used by Jupiter for big integers

const app = express();
app.use(express.json());
app.use(cors());

// ----- CONFIGURATION -----

// Constants
const SOL_DECIMALS = 1e9;
const USDC_DECIMALS = 1e6;
const SOLSCAN_API_BASE = 'https://public-api.solscan.io/account/tokens?account=';

// Set up Solana connection - use mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112', // Native SOL wrapped token address
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC token address
};

// Jupiter router configuration - used for token swaps
let jupiterInstance = null;

// Initialize Jupiter
async function initializeJupiter() {
  try {
    jupiterInstance = await Jupiter.load({
      connection,
      cluster: 'mainnet-beta',
      user: null // Will be set per transaction
    });
    console.log('Jupiter initialized successfully');
  } catch (error) {
    console.error('Error initializing Jupiter:', error);
    throw error;
  }
}

// ----- PRICE SERVICE -----

// Price service that fetches real prices from cryptocurrency exchanges
class PriceService {
  constructor() {
    // Initialize with default price
    this.solUsdcPrice = 48.75; // Default price until first fetch
    this.lastUpdate = 0;
    this.updating = false;
    
    // Fetch price immediately and then every minute
    this.fetchPrice();
    setInterval(() => this.fetchPrice(), 60000); // Update every minute
  }
  
  // Fetch real price from cryptocurrency APIs
  async fetchPrice() {
    if (this.updating) return; // Prevent concurrent updates
    this.updating = true;
    
    try {
      // Try CoinGecko first
      console.log("Fetching SOL/USDC price from CoinGecko...");
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'solana',
          vs_currencies: 'usd'
        }
      });
      
      if (response.data && response.data.solana && response.data.solana.usd) {
        this.solUsdcPrice = response.data.solana.usd;
        this.lastUpdate = Date.now();
        console.log(`Updated SOL/USDC price from CoinGecko: $${this.solUsdcPrice.toFixed(2)}`);
      } else {
        throw new Error("Could not extract price from CoinGecko response");
      }
    } catch (error) {
      console.error("Error fetching price from CoinGecko:", error.message);
      
      // Fallback to Binance API
      try {
        console.log("Trying fallback to Binance API...");
        const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: { symbol: 'SOLUSDT' }
        });
        
        if (binanceResponse.data && binanceResponse.data.price) {
          this.solUsdcPrice = parseFloat(binanceResponse.data.price);
          this.lastUpdate = Date.now();
          console.log(`Updated SOL/USDC price from Binance: $${this.solUsdcPrice.toFixed(2)}`);
        } else {
          throw new Error("Could not extract price from Binance response");
        }
      } catch (binanceError) {
        console.error("Binance fallback also failed:", binanceError.message);
        
        // Fallback to Coinbase API
        try {
          console.log("Trying second fallback to Coinbase API...");
          const coinbaseResponse = await axios.get('https://api.coinbase.com/v2/prices/SOL-USD/spot');
          
          if (coinbaseResponse.data && coinbaseResponse.data.data && coinbaseResponse.data.data.amount) {
            this.solUsdcPrice = parseFloat(coinbaseResponse.data.data.amount);
            this.lastUpdate = Date.now();
            console.log(`Updated SOL/USDC price from Coinbase: $${this.solUsdcPrice.toFixed(2)}`);
          } else {
            console.log("Could not extract price from Coinbase response, using last known price");
          }
        } catch (coinbaseError) {
          console.error("All price APIs failed, using last known price:", coinbaseError.message);
        }
      }
    } finally {
      this.updating = false;
    }
  }
  
  // Get current price
  getPrice() {
    // If price is stale (>10 min old), trigger a new fetch
    if (Date.now() - this.lastUpdate > 600000) {
      this.fetchPrice();
    }
    return this.solUsdcPrice;
  }
  
  // Add some spread to simulate buy/sell difference
  getBuyPrice() {
    return this.solUsdcPrice * 1.005; // 0.5% higher for buys
  }
  
  getSellPrice() {
    return this.solUsdcPrice * 0.995; // 0.5% lower for sells
  }
}

// Create singleton price service
const priceService = new PriceService();

// ----- WALLET SERVICE FUNCTIONS -----

// Generate a new wallet
function generateWallet() {
  const keypair = Keypair.generate();
  return {
    address: keypair.publicKey.toString(),
    privateKey: bs58.encode(keypair.secretKey)
  };
}

// Get wallet keypair from private key
function getKeypairFromPrivateKey(privateKey) {
  const secretKey = bs58.decode(privateKey);
  return Keypair.fromSecretKey(secretKey);
}

// Get native SOL balance
async function getSolBalance(walletAddress) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const solBalance = await connection.getBalance(publicKey);
    return solBalance / SOL_DECIMALS;
  } catch (error) {
    console.error('Error getting SOL balance:', error.message);
    return 0;
  }
}

// Get token balance
async function getTokenBalance(walletAddress, tokenMint) {
  try {
    // For SOL, use direct balance check
    if (tokenMint === TOKENS.SOL) {
      return await getSolBalance(walletAddress);
    }

    // Try to get associated token account
    const publicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMint);
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMintPublicKey,
      publicKey
    );

    try {
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
      return accountInfo.value.uiAmount;
    } catch (error) {
      // Token account might not exist yet
      console.warn(`Token account doesn't exist or is not initialized: ${error.message}`);
      return 0;
    }
  } catch (error) {
    console.error(`Failed to fetch balance for ${tokenMint}:`, error.message);
    return 0;
  }
}

// Get all balances for a wallet
async function getBalances(address) {
  try {
    // Get SOL balance
    const solBalance = await getSolBalance(address);
    
    // Get USDC balance
    const usdcBalance = await getTokenBalance(address, TOKENS.USDC);
    
    return {
      sol: solBalance,
      usdc: usdcBalance || 0
    };
  } catch (error) {
    console.error('Error getting balances:', error.message);
    throw error;
  }
}

// Execute swap using Jupiter aggregator
async function executeSwap(privateKey, action, amount) {
  try {
    if (!jupiterInstance) {
      await initializeJupiter();
    }

    // Get keypair from private key
    const keypair = getKeypairFromPrivateKey(privateKey);
    
    // Define input and output tokens based on the action
    const inputMint = action === 'buy' 
      ? new PublicKey(TOKENS.USDC) 
      : new PublicKey(TOKENS.SOL);
    
    const outputMint = action === 'buy' 
      ? new PublicKey(TOKENS.SOL) 
      : new PublicKey(TOKENS.USDC);
    
    // Convert amount to the correct format with decimals
    const inputDecimals = action === 'buy' ? USDC_DECIMALS : SOL_DECIMALS;
    const amountInLamports = Math.floor(amount * inputDecimals).toString();
    
    console.log(`Executing ${action.toUpperCase()} swap: ${amount} ${action === 'buy' ? 'USDC → SOL' : 'SOL → USDC'}`);

    // Find routes
    const routes = await jupiterInstance.computeRoutes({
      inputMint,
      outputMint,
      amount: JSBI.BigInt(amountInLamports),
      slippageBps: 50, // 0.5% slippage
      forceFetch: true
    });

    if (!routes || !routes.routesInfos || routes.routesInfos.length === 0) {
      throw new Error('No routes found for swap');
    }

    // Select the best route
    const bestRoute = routes.routesInfos[0];
    console.log(`Best route found with outAmount: ${bestRoute.outAmount}`);

    // Execute the swap
    const { execute } = await jupiterInstance.exchange({
      routeInfo: bestRoute,
      userPublicKey: keypair.publicKey,
      wrapUnwrapSOL: true
    });

    // Execute the transaction
    const swapResult = await execute(
      { wallet: keypair }, // Pass keypair as wallet for signing
      connection
    );

    // Check result
    if (!swapResult.txid) {
      throw new Error('Swap transaction failed');
    }

    console.log(`Swap successful! Transaction ID: ${swapResult.txid}`);
    
    // Calculate output amount
    const outputDecimals = action === 'buy' ? SOL_DECIMALS : USDC_DECIMALS;
    const outAmount = parseFloat(bestRoute.outAmount) / outputDecimals;

    return {
      success: true,
      inAmount: amount,
      outAmount,
      txId: swapResult.txid,
      price: action === 'buy' ? priceService.getBuyPrice() : priceService.getSellPrice(),
      priceImpact: bestRoute.priceImpactPct ? parseFloat(bestRoute.priceImpactPct) / 100 : 0.001, // Convert to decimal
      fee: action === 'buy' 
        ? (amount * 0.003).toFixed(6) // 0.3% fee
        : ((outAmount * 0.003) / (1 - 0.003)).toFixed(6) // 0.3% fee
    };
  } catch (error) {
    console.error(`Error executing ${action} swap:`, error);
    throw new Error(`Swap failed: ${error.message}`);
  }
}

// Airdrop SOL to a new wallet (for testing purposes)
async function requestAirdrop(walletAddress, amount = 1) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    return true;
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    return false;
  }
}

// ----- API ENDPOINTS -----

// 1. Create Wallet
app.post('/create-wallet', async (req, res) => {
  try {
    const newWallet = generateWallet();
    
    // Return the new wallet details
    res.json({ 
      success: true, 
      wallet: {
        address: newWallet.address,
        privateKey: newWallet.privateKey
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Check Balances
app.post('/check-balances', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "No wallet address provided"
      });
    }
    
    const balances = await getBalances(address);
    res.json({ 
      success: true, 
      balances 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 3. Set initial balances for a wallet (fund it with Solana for testing)
app.post('/set_swap', async (req, res) => {
  try {
    const { sol, usdc, address } = req.body;
    
    // Validate inputs
    if (sol === undefined && usdc === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters (sol or usdc)"
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required"
      });
    }
    
    // Get current balances as a baseline
    const currentBalances = await getBalances(address);
    
    // Note: In a real environment, we'd transfer tokens here
    // For this example, we're not actually modifying balances on blockchain
    // In reality, users would need to fund their wallet through a proper exchange
    
    res.json({
      success: true,
      message: "Wallet info stored. Note: This doesn't actually fund your wallet. Use a real exchange for that.",
      config: {
        sol: parseFloat(sol) || currentBalances.sol,
        usdc: parseFloat(usdc) || currentBalances.usdc,
        address: address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Fetch wallet and price info
app.post('/fetch_pair', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required"
      });
    }
    
    // Get current balances
    const balances = await getBalances(address);

    res.json({
      success: true,
      sol: balances.sol,
      usdc: balances.usdc,
      address: address,
      currentPrice: priceService.getPrice()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Current Price
app.post('/price', (req, res) => {
  try {
    const currentPrice = priceService.getPrice();
    const buyPrice = priceService.getBuyPrice();
    const sellPrice = priceService.getSellPrice();
    
    res.json({
      success: true,
      price: currentPrice,
      buyPrice,
      sellPrice,
      timestamp: Date.now(),
      lastUpdate: priceService.lastUpdate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Perform actual swap on Solana mainnet
app.post('/swap', async (req, res) => {
  try {
    const { action, privateKey, amount } = req.body;
    
    // Validate inputs
    if (!action || (action !== 'buy' && action !== 'sell')) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'buy' or 'sell'."
      });
    }

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Private key is required to sign transactions"
      });
    }

    // Get keypair and check balances
    const keypair = getKeypairFromPrivateKey(privateKey);
    const address = keypair.publicKey.toString();
    const balances = await getBalances(address);
    
    // Determine amount to swap if not specified
    let swapAmount;
    if (amount) {
      swapAmount = parseFloat(amount);
    } else {
      // Use all available balance if amount not specified
      swapAmount = action === 'buy' ? balances.usdc : balances.sol;
    }
    
    // Check if user has enough balance
    if ((action === 'buy' && balances.usdc < swapAmount) || 
        (action === 'sell' && balances.sol < swapAmount)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient ${action === 'buy' ? 'USDC' : 'SOL'} balance for swap`
      });
    }

    // Check if amount is too small
    if (swapAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: `${action === 'buy' ? 'USDC' : 'SOL'} amount must be greater than 0`
      });
    }
    
    // Execute the swap
    const swapResult = await executeSwap(privateKey, action, swapAmount);
    
    // Return the result
    res.json(swapResult);
  } catch (error) {
    console.error('Swap error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 7. Airdrop SOL (for development/testing, works only on devnet/testnet)
app.post('/airdrop', async (req, res) => {
  try {
    const { address, amount } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required"
      });
    }
    
    // This will only work on devnet/testnet
    const result = await requestAirdrop(address, amount || 1);
    
    if (result) {
      res.json({
        success: true,
        message: `Airdropped ${amount || 1} SOL to ${address}`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Airdrop failed. Note: Airdrops only work on devnet/testnet."
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----- SERVER STARTUP -----

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Initializing Jupiter...');
  await initializeJupiter().catch(err => {
    console.error('Failed to initialize Jupiter:', err);
    process.exit(1);
  });
  console.log('Fetching initial SOL/USDC price...');
});
