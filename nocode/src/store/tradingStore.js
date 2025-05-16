// src/store/tradingStore.js
import { create } from 'zustand';
import { 
  createWallet, 
  checkBalances, 
  setSwapConfiguration, 
  fetchPair, 
  getPrice, 
  executeSwap 
} from '../services/tradingApiService';

export const useTradingStore = create((set, get) => ({
  // State
  wallet: null,
  balances: null,
  solanaPrice: null,
  tradingHistory: [],
  isLoading: false,
  error: null,
  
  // Trading settings
  tradingSettings: {
    profit: 0.1,  // 10% profit target
    loss: 0.05,   // 5% stop loss
    risk: 'medium' // low, medium, high
  },
  
  // Update trading settings
  updateTradingSettings: (newSettings) => {
    set(state => ({
      tradingSettings: {
        ...state.tradingSettings,
        ...newSettings
      }
    }));
  },
  
  // Create a new wallet
  createWallet: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await createWallet();
      
      if (response.success) {
        set({ 
          wallet: response.wallet,
          isLoading: false 
        });
        
        // Check balances after wallet creation
        get().checkBalances(response.wallet.address);
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      set({ 
        error: error.message || 'Failed to create wallet', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Check balances
  checkBalances: async (address) => {
    if (!address && !get().wallet?.address) {
      return;
    }
    
    const walletAddress = address || get().wallet.address;
    set({ isLoading: true, error: null });
    
    try {
      const response = await checkBalances(walletAddress);
      
      if (response.success) {
        set({ 
          balances: response.balances,
          isLoading: false 
        });
        
        return response.balances;
      } else {
        throw new Error(response.message || 'Failed to check balances');
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
  
  // Set amount to trade with
  setTradeAmount: async (amount) => {
    set({ isLoading: true, error: null });
    
    try {
      const config = {
        sol: 0,
        usdc: parseFloat(amount)
      };
      
      // Add wallet address if available
      if (get().wallet?.address) {
        config.address = get().wallet.address;
      }
      
      const response = await setSwapConfiguration(config);
      
      if (response.success) {
        // Update the balances based on the new configuration
        set({ 
          balances: {
            sol: response.config.sol,
            usdc: response.config.usdc
          },
          isLoading: false 
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to set trade amount');
      }
    } catch (error) {
      console.error('Error setting trade amount:', error);
      set({ 
        error: error.message || 'Failed to set trade amount', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Fetch current pair status and price
  fetchPair: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetchPair();
      
      if (response.success) {
        set({ 
          balances: {
            sol: response.sol,
            usdc: response.usdc
          },
          wallet: response.address ? {
            address: response.address
          } : get().wallet,
          solanaPrice: {
            price: response.currentPrice
          },
          isLoading: false 
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch pair');
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
      const response = await getPrice();
      
      if (response.success) {
        set({ 
          solanaPrice: response,
          isLoading: false 
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to get price');
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
  
  // Execute a swap (buy/sell)
  executeSwap: async (action) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await executeSwap(action);
      
      if (response.success) {
        // Add to trading history
        const historyEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          action,
          inAmount: response.inAmount,
          outAmount: response.outAmount,
          price: response.price,
          fee: response.fee
        };
        
        set(state => ({
          tradingHistory: [...state.tradingHistory, historyEntry]
        }));
        
        // Update balances
        await get().fetchPair();
        
        set({ isLoading: false });
        return response;
      } else {
        throw new Error(response.message || 'Swap failed');
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
  
  // Fetch price periodically
  startPriceFetching: () => {
    const interval = setInterval(async () => {
      try {
        await get().getPrice();
      } catch (error) {
        console.error('Price fetch error:', error);
      }
    }, 30000); // Update every 30 seconds
    
    // Store the interval ID for cleanup
    set({ priceInterval: interval });
    
    // Initial fetch
    get().getPrice();
    
    return interval;
  },
  
  // Stop price fetching
  stopPriceFetching: () => {
    const { priceInterval } = get();
    if (priceInterval) {
      clearInterval(priceInterval);
      set({ priceInterval: null });
    }
  },
  
  // Reset store
  resetStore: () => {
    const { stopPriceFetching } = get();
    stopPriceFetching();
    
    set({
      wallet: null,
      balances: null,
      solanaPrice: null,
      tradingHistory: [],
      isLoading: false,
      error: null,
      priceInterval: null
    });
  }
}));