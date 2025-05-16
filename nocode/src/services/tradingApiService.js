// src/services/tradingApiService.js
/**
 * Trading API Service for DeFAI Agent Deployer
 * Handles interaction with the Solana trading API
 */

// Use your API base URL - update this to your actual endpoint
const API_BASE_URL = 'http://localhost:5000';

/**
 * Creates a new Solana wallet for trading
 * @returns {Promise<{success: boolean, wallet?: object, message?: string}>}
 */
export const createWallet = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating wallet:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};

/**
 * Checks balances for a wallet address
 * @param {string} address - The wallet address to check
 * @returns {Promise<{success: boolean, balances?: {sol: number, usdc: number}, message?: string}>}
 */
export const checkBalances = async (address) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error checking balances:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};

/**
 * Sets the swap configuration (SOL and USDC amounts)
 * @param {object} config - The swap configuration
 * @param {number} config.sol - SOL amount
 * @param {number} config.usdc - USDC amount
 * @param {string} [config.address] - The wallet address (optional)
 * @returns {Promise<{success: boolean, config?: object, message?: string}>}
 */
export const setSwapConfiguration = async (config) => {
  try {
    const response = await fetch(`${API_BASE_URL}/set_swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    return await response.json();
  } catch (error) {
    console.error('Error setting swap configuration:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};

/**
 * Fetches current pair status and price
 * @returns {Promise<{success: boolean, sol?: number, usdc?: number, currentPrice?: number, message?: string}>}
 */
export const fetchPair = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch_pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching pair:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};

/**
 * Gets current SOL/USDC price
 * @returns {Promise<{success: boolean, price?: number, buyPrice?: number, sellPrice?: number, message?: string}>}
 */
export const getPrice = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    return await response.json();
  } catch (error) {
    console.error('Error getting price:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};

/**
 * Executes a swap (buy/sell)
 * @param {string} action - 'buy' or 'sell'
 * @returns {Promise<{success: boolean, inAmount?: number, outAmount?: number, price?: number, message?: string}>}
 */
export const executeSwap = async (action) => {
  try {
    const response = await fetch(`${API_BASE_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      message: 'Failed to connect to trading service'
    };
  }
};