// src/store/solanaStore.js
import { create } from 'zustand';

// API endpoint for Solana trading
const API_ENDPOINT = 'http://localhost:5000';

export const useSolanaStore = create((set, get) => ({
  // State
  solanaPrice: null,
  solanaBalances: null,
  solanaWallet: null,
  tradingSettings: {
    profit: 0.1,  // 10% profit target
    loss: 0.05,   // 5% stop loss
    risk: 'medium' // low, medium, high
  },
  isLoading: false,
  error: null,
  
  // Update trading settings
  updateTradingSettings: (newSettings) => {
    set(state => ({
      tradingSettings: {
        ...state.tradingSettings,
        ...newSettings
      }
    }));
  },
  
  // Create a new Solana wallet
  createWallet: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_ENDPOINT}/create-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        set({ 
          solanaWallet: data.wallet,
          isLoading: false 
        });
        
        // Check balances after wallet creation
        get().checkBalances(data.wallet.address);
        
        return data;
      } else {
        throw new Error(data.message || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating Solana wallet:', error);
      set({ 
        error: error.message || 'Failed to create Solana wallet', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Check wallet balances
  checkBalances: async (address) => {
    if (!address && !get().solanaWallet?.address) {
      return;
    }
    
    const walletAddress = address || get().solanaWallet.address;
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_ENDPOINT}/check-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress })
      });
      
      const data = await response.json();
      
      if (data.success) {
        set({ 
          solanaBalances: data.balances,
          isLoading: false 
        });
        
        return data.balances;
      } else {
        throw new Error(data.message || 'Failed to check balances');
      }
    } catch (error) {
      console.error('Error checking balances:', error);
      set({ 
        error: error.message || 'Failed to check balances', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Set swap configuration
  setSwapConfiguration: async (config) => {
    set({ isLoading: true, error: null });
    
    try {
      const requestBody = {
        ...config
      };
      
      // Add wallet address if available
      if (get().solanaWallet?.address) {
        requestBody.address = get().solanaWallet.address;
      }
      
      const response = await fetch(`${API_ENDPOINT}/set_swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the balances based on the new configuration
        set({ 
          solanaBalances: {
            sol: data.config.sol,
            usdc: data.config.usdc
          },
          isLoading: false 
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Failed to set swap configuration');
      }
    } catch (error) {
      console.error('Error setting swap configuration:', error);
      set({ 
        error: error.message || 'Failed to set swap configuration', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Fetch current pair status
  fetchPair: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_ENDPOINT}/fetch_pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty object as this endpoint doesn't require parameters
      });
      
      const data = await response.json();
      
      if (data.success) {
        set({ 
          solanaBalances: {
            sol: data.sol,
            usdc: data.usdc
          },
          solanaWallet: data.address ? {
            address: data.address
          } : get().solanaWallet,
          solanaPrice: {
            price: data.currentPrice
          },
          isLoading: false 
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch pair');
      }
    } catch (error) {
      console.error('Error fetching pair:', error);
      set({ 
        error: error.message || 'Failed to fetch pair', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Get current SOL/USDC price
  getPrice: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_ENDPOINT}/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty object as this endpoint doesn't require parameters
      });
      
      const data = await response.json();
      
      if (data.success) {
        set({ 
          solanaPrice: data,
          isLoading: false 
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Failed to get price');
      }
    } catch (error) {
      console.error('Error getting price:', error);
      set({ 
        error: error.message || 'Failed to get price', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Deploy agent with trading parameters
  deployAgent: async (uid, walletAddress) => {
    set({ isLoading: true, error: null });
    const { tradingSettings } = get();
    
    try {
      // In a real implementation, this would call an API endpoint like:
      // /deploy with the trading settings
      
      // For now, we'll just simulate a successful deployment
      console.log('Deploying agent with settings:', {
        uid,
        walletAddress,
        ...tradingSettings
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ isLoading: false });
      return {
        success: true,
        message: 'Agent deployed successfully'
      };
    } catch (error) {
      console.error('Error deploying agent:', error);
      set({ 
        error: error.message || 'Failed to deploy agent', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Execute a swap
  executeSwap: async ({ action }) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_ENDPOINT}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // After successful swap, update balances
        await get().fetchPair();
        
        set({ isLoading: false });
        return data;
      } else {
        throw new Error(data.message || 'Swap failed');
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      set({ 
        error: error.message || 'Swap failed', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Fetch Solana price and update state
  fetchSolanaPrice: async () => {
    const { getPrice } = get();
    try {
      await getPrice();
    } catch (error) {
      console.error('Error fetching Solana price:', error);
    }
  },
  
  // Reset store state
  resetStore: () => {
    set({
      solanaPrice: null,
      solanaBalances: null,
      solanaWallet: null,
      isLoading: false,
      error: null
    });
  }
}));