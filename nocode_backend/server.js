// All-in-one server.js with real price fetching - All endpoints using POST
const express = require('express');
const {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const bs58 = require('bs58');
const axios = require('axios');

const app = express();
app.use(express.json());

// ----- CONFIGURATION -----

// Store the swap configuration and balances
const swapConfig = {
  sol: 0,        // Amount of SOL available for swaps
  usdc: 0,       // Amount of USDC available for swaps
  address: null, // Wallet address
  privateKey: null // Wallet private key
};

// Constants
const SOL_DECIMALS = 1e9;
const USDC_DECIMALS = 1e6;
const SOLSCAN_API_BASE = 'https://public-api.solscan.io/account/tokens?account=';
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};

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

// Get token balance from Solscan API or directly from Solana
async function getTokenBalance(walletAddress, tokenMint) {
  try {
    // For SOL, use direct balance check
    if (tokenMint === TOKENS.SOL) {
      return await getSolBalance(walletAddress);
    }

    // For other tokens, first try Solscan API
    try {
      const url = `${SOLSCAN_API_BASE}${walletAddress}`;
      const response = await axios.get(url);
      if (response.data && Array.isArray(response.data)) {
        const tokenAccount = response.data.find(t => t.tokenAddress === tokenMint);
        if (tokenAccount) {
          return tokenAccount.tokenAmount.uiAmount;
        }
      }
    } catch (solscanError) {
      console.warn(`Solscan API error: ${solscanError.message}`);
    }

    // Fallback to direct token account query
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(tokenMint) }
      );

      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return balance;
      }
    } catch (error) {
      console.warn(`Token account query error: ${error.message}`);
    }

    return 0;
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

// ----- API ENDPOINTS -----

// 1. Create Wallet
app.post('/create-wallet', (req, res) => {
  try {
    const newWallet = generateWallet();
    
    // Store the wallet details in swapConfig
    swapConfig.address = newWallet.address;
    swapConfig.privateKey = newWallet.privateKey;
    
    res.json({ success: true, wallet: newWallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Check Balances
app.post('/check-balances', async (req, res) => {
  try {
    const address = req.body.address || swapConfig.address;
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "No wallet address provided"
      });
    }
    
    const balances = await getBalances(address);
    res.json({ success: true, balances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Set Swap Configuration
app.post('/set_swap', (req, res) => {
  try {
    const { sol, usdc, address, privateKey } = req.body;
    
    // Validate inputs
    if (sol === undefined || usdc === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters (sol, usdc)"
      });
    }
    
    // Update the swap configuration
    swapConfig.sol = parseFloat(sol) || 0;
    swapConfig.usdc = parseFloat(usdc) || 0;
    
    // Optionally update wallet if provided
    if (address) swapConfig.address = address;
    if (privateKey) swapConfig.privateKey = privateKey;
    
    console.log('Swap configuration updated:', {
      sol: swapConfig.sol,
      usdc: swapConfig.usdc,
      address: swapConfig.address ? `${swapConfig.address.slice(0, 8)}...` : null
    });
    
    res.json({
      success: true,
      message: "Swap configuration updated",
      config: {
        sol: swapConfig.sol,
        usdc: swapConfig.usdc,
        address: swapConfig.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Fetch Pair - Changed to POST
app.post('/fetch_pair', (req, res) => {
  try {
    res.json({
      success: true,
      sol: swapConfig.sol,
      usdc: swapConfig.usdc,
      address: swapConfig.address,
      currentPrice: priceService.getPrice()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Current Price - Changed to POST
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

// 6. Perform Swap with minimal output
app.post('/swap', async (req, res) => {
  try {
    const { action } = req.body; // 'buy' or 'sell'
    
    // Validate that swap config is set up
    if (!swapConfig.address || !swapConfig.privateKey) {
      return res.status(400).json({
        success: false,
        error: "Wallet not configured. Call /create-wallet first."
      });
    }
    
    // Validate action
    if (!action || (action !== 'buy' && action !== 'sell')) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'buy' or 'sell'."
      });
    }
    
    if (action === 'buy') {
      // BUY: Use all USDC to buy SOL
      if (swapConfig.usdc <= 0) {
        return res.status(400).json({
          success: false,
          error: "No USDC available for swap. Set USDC amount using /set_swap."
        });
      }
      
      console.log(`Executing BUY: Using ${swapConfig.usdc} USDC to buy SOL`);
      
      // Get current price
      const price = priceService.getBuyPrice();
      const swapFeeRate = 0.003; // 0.3% swap fee
      const inAmount = swapConfig.usdc;
      const outAmount = inAmount / price * (1 - swapFeeRate);
      const priceImpact = Math.min(inAmount / 5000, 0.05).toFixed(2); // 1% impact per 5000 USDC, max 5%
      const fee = (inAmount * swapFeeRate).toFixed(2);
      
      // Update stored amounts (internally tracked but not shown in response)
      swapConfig.usdc = 0;
      swapConfig.sol += outAmount;
      
      // Return clean response
      res.json({
        success: true,
        inAmount,
        outAmount: parseFloat(outAmount.toFixed(4)),
        price,
        priceImpact: parseFloat(priceImpact),
        fee: parseFloat(fee)
      });
      
    } else {
      // SELL: Sell all SOL to get USDC
      if (swapConfig.sol <= 0) {
        return res.status(400).json({
          success: false,
          error: "No SOL available for swap. Set SOL amount using /set_swap."
        });
      }
      
      console.log(`Executing SELL: Selling ${swapConfig.sol} SOL for USDC`);
      
      // Get current price
      const price = priceService.getSellPrice();
      const swapFeeRate = 0.003; // 0.3% swap fee
      const inAmount = swapConfig.sol;
      const outAmount = inAmount * price * (1 - swapFeeRate);
      const priceImpact = Math.min(inAmount / 100, 0.05).toFixed(2); // 1% impact per 100 SOL, max 5%
      const fee = (outAmount * swapFeeRate / (1 - swapFeeRate)).toFixed(2);
      
      // Update stored amounts (internally tracked but not shown in response)
      swapConfig.sol = 0;
      swapConfig.usdc += outAmount;
      
      // Return clean response
      res.json({
        success: true,
        inAmount,
        outAmount: parseFloat(outAmount.toFixed(4)),
        price,
        priceImpact: parseFloat(priceImpact),
        fee: parseFloat(fee)
      });
    }
  } catch (error) {
    console.error('Swap error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ----- SERVER STARTUP -----

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Fetching initial SOL/USDC price...`);
});