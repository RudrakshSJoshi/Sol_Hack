// src/components/dashboard/TradingPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsArrowUpRight, 
  BsArrowDownRight, 
  BsCurrencyExchange, 
  BsCashCoin,
  BsWallet2,
  BsGraphUp,
  BsGear,
  BsExclamationTriangle
} from 'react-icons/bs';
import { useTradingStore } from '../../store/tradingStore';
import TradeConfirmationModal from '../modals/TradeConfirmationModal';

// Create a new CSS file for this component
import '../../styles/TradingPanel.css';

const TradingPanel = () => {
  const { 
    wallet, 
    balances, 
    solanaPrice, 
    tradingHistory,
    isLoading,
    error,
    createWallet,
    checkBalances,
    setTradeAmount,
    getPrice,
    executeSwap,
    startPriceFetching,
    stopPriceFetching 
  } = useTradingStore();
  
  const [tradeAmount, setTradeAmountState] = useState('100');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState('buy');
  
  // Initialize when component mounts
  useEffect(() => {
    // Start price fetching
    const interval = startPriceFetching();
    
    // Cleanup when component unmounts
    return () => {
      stopPriceFetching();
    };
  }, [startPriceFetching, stopPriceFetching]);
  
  // Handle wallet creation
  const handleCreateWallet = async () => {
    try {
      await createWallet();
    } catch (error) {
      console.error('Wallet creation error:', error);
    }
  };
  
  // Handle settings trade amount
  const handleSetTradeAmount = async () => {
    if (!tradeAmount || isNaN(parseFloat(tradeAmount)) || parseFloat(tradeAmount) <= 0) {
      alert('Please enter a valid trade amount');
      return;
    }
    
    try {
      await setTradeAmount(tradeAmount);
    } catch (error) {
      console.error('Set trade amount error:', error);
    }
  };
  
  // Open trade modal
  const openTradeModal = (action) => {
    setTradeAction(action);
    setShowTradeModal(true);
  };
  
  // Handle trade confirmation
  const handleTradeConfirm = async (action) => {
    try {
      await executeSwap(action);
    } catch (error) {
      console.error('Trade execution error:', error);
    }
  };
  
  // Format currency
  const formatCurrency = (value, decimals = 2) => {
    if (value === undefined || value === null) return '0.00';
    return parseFloat(value).toFixed(decimals);
  };
  
  // Calculate profit/loss
  const calculateProfitLoss = () => {
    if (!tradingHistory.length) return { value: 0, percentage: 0 };
    
    // Calculate total spent vs current value
    let totalSpentUSDC = 0;
    let totalBoughtSOL = 0;
    let totalSpentSOL = 0;
    let totalBoughtUSDC = 0;
    
    tradingHistory.forEach(trade => {
      if (trade.action === 'buy') {
        totalSpentUSDC += trade.inAmount;
        totalBoughtSOL += trade.outAmount;
      } else if (trade.action === 'sell') {
        totalSpentSOL += trade.inAmount;
        totalBoughtUSDC += trade.outAmount;
      }
    });
    
    // Current value of holdings
    const currentSOLValueInUSDC = (balances?.sol || 0) * (solanaPrice?.price || 0);
    const totalValueInUSDC = currentSOLValueInUSDC + (balances?.usdc || 0);
    
    // Initial value
    const initialValueInUSDC = totalSpentUSDC + totalBoughtUSDC - (totalSpentSOL * solanaPrice?.price || 0);
    
    // Calculate profit/loss
    const profitLossValue = totalValueInUSDC - initialValueInUSDC;
    const profitLossPercentage = initialValueInUSDC === 0 ? 0 : (profitLossValue / initialValueInUSDC) * 100;
    
    return {
      value: profitLossValue,
      percentage: profitLossPercentage
    };
  };
  
  const profitLoss = calculateProfitLoss();
  
  return (
    <div className="trading-panel">
      <div className="trading-section wallet-section">
        <div className="section-header">
          <h3><BsWallet2 /> Wallet</h3>
        </div>
        
        <div className="section-content">
          {wallet ? (
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="info-label">Address:</span>
                <span className="info-value">
                  {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                </span>
              </div>
              
              <div className="wallet-balances">
                <div className="balance-item">
                  <span className="balance-label">SOL:</span>
                  <span className="balance-value">{formatCurrency(balances?.sol, 4)}</span>
                </div>
                
                <div className="balance-item">
                  <span className="balance-label">USDC:</span>
                  <span className="balance-value">{formatCurrency(balances?.usdc, 2)}</span>
                </div>
                
                <div className="balance-item total-balance">
                  <span className="balance-label">Total Value (USDC):</span>
                  <span className="balance-value">
                    {formatCurrency(
                      (balances?.sol || 0) * (solanaPrice?.price || 0) + (balances?.usdc || 0),
                      2
                    )}
                  </span>
                </div>
              </div>
              
              <div className="profit-loss">
                <span className="pl-label">Profit/Loss:</span>
                <span className={`pl-value ${profitLoss.value >= 0 ? 'positive' : 'negative'}`}>
                  {profitLoss.value >= 0 ? '+' : ''}{formatCurrency(profitLoss.value, 2)} USDC
                  ({profitLoss.value >= 0 ? '+' : ''}{formatCurrency(profitLoss.percentage, 2)}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="wallet-create">
              <p>No wallet connected. Create a wallet to start trading.</p>
              <button 
                className="create-wallet-btn"
                onClick={handleCreateWallet}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="trading-section price-section">
        <div className="section-header">
          <h3><BsCurrencyExchange /> Current Price</h3>
        </div>
        
        <div className="section-content">
          <div className="price-display">
            <div className="current-price">
              <span className="price-label">SOL/USDC:</span>
              <span className="price-value">${formatCurrency(solanaPrice?.price, 2)}</span>
            </div>
            
            <div className="price-details">
              <div className="price-item">
                <span className="price-item-label">Buy Price:</span>
                <span className="price-item-value">${formatCurrency(solanaPrice?.buyPrice || solanaPrice?.price, 2)}</span>
              </div>
              
              <div className="price-item">
                <span className="price-item-label">Sell Price:</span>
                <span className="price-item-value">${formatCurrency(solanaPrice?.sellPrice || solanaPrice?.price, 2)}</span>
              </div>
              
              <div className="price-item">
                <span className="price-item-label">Last Updated:</span>
                <span className="price-item-value">
                  {solanaPrice?.lastUpdate 
                    ? new Date(solanaPrice.lastUpdate).toLocaleTimeString() 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="trading-section trade-setup-section">
        <div className="section-header">
          <h3><BsGear /> Trade Setup</h3>
        </div>
        
        <div className="section-content">
          <div className="trade-amount-setup">
            <div className="input-group">
              <label htmlFor="trade-amount">USDC Amount:</label>
              <div className="input-wrapper">
                <input 
                  id="trade-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmountState(e.target.value)}
                  disabled={!wallet || isLoading}
                />
                <span className="input-suffix">USDC</span>
              </div>
            </div>
            
            <button 
              className="set-amount-btn"
              onClick={handleSetTradeAmount}
              disabled={!wallet || isLoading}
            >
              {isLoading ? 'Setting...' : 'Set Trade Amount'}
            </button>
          </div>
          
          <div className="trading-actions">
            <button 
              className="trade-btn buy-btn"
              onClick={() => openTradeModal('buy')}
              disabled={!wallet || isLoading || !balances?.usdc || balances.usdc <= 0}
            >
              <BsArrowUpRight /> Buy SOL
            </button>
            
            <button 
              className="trade-btn sell-btn"
              onClick={() => openTradeModal('sell')}
              disabled={!wallet || isLoading || !balances?.sol || balances.sol <= 0}
            >
              <BsArrowDownRight /> Sell SOL
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <BsExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      
      {showTradeModal && (
        <TradeConfirmationModal 
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          onConfirm={handleTradeConfirm}
          tradeAction={tradeAction}
          balances={balances}
          currentPrice={solanaPrice}
        />
      )}
    </div>
  );
};

export default TradingPanel;