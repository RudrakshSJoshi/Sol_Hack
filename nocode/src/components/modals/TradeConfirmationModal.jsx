// src/components/modals/TradeConfirmationModal.jsx
import React, { useState } from 'react';
import { BsArrowUpRight, BsArrowDownRight, BsCurrencyExchange, BsX } from 'react-icons/bs';
import '../../styles/Modals.css';

const TradeConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tradeAction, 
  balances, 
  currentPrice 
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  if (!isOpen) return null;
  
  const isBuy = tradeAction === 'buy';
  const availableAmount = isBuy ? balances?.usdc : balances?.sol;
  const estimatedReceive = isBuy 
    ? (balances?.usdc / (currentPrice?.buyPrice || currentPrice?.price || 1)).toFixed(4)
    : (balances?.sol * (currentPrice?.sellPrice || currentPrice?.price || 1)).toFixed(2);
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(tradeAction);
      onClose();
    } catch (error) {
      console.error('Trade confirmation error:', error);
    } finally {
      setIsConfirming(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className="modal-header">
          <h3>
            {isBuy ? (
              <><BsArrowUpRight className="buy-icon" /> Buy SOL</>
            ) : (
              <><BsArrowDownRight className="sell-icon" /> Sell SOL</>
            )}
          </h3>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            <BsX />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="price-info">
            <div className="current-price">
              <BsCurrencyExchange />
              <div>
                <span className="price-label">Current Price</span>
                <span className="price-value">
                  ${isBuy 
                    ? (currentPrice?.buyPrice || currentPrice?.price || 0).toFixed(2) 
                    : (currentPrice?.sellPrice || currentPrice?.price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="trade-details">
            <div className="detail-row">
              <span className="detail-label">You will {isBuy ? 'spend' : 'sell'}</span>
              <span className="detail-value">
                {availableAmount} {isBuy ? 'USDC' : 'SOL'}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Estimated {isBuy ? 'receive' : 'receive'}</span>
              <span className="detail-value">
                {estimatedReceive} {isBuy ? 'SOL' : 'USDC'}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Price Impact</span>
              <span className="detail-value">~0.02%</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Fee</span>
              <span className="detail-value">0.3%</span>
            </div>
          </div>
          
          <div className="trade-warning">
            <p>
              {isBuy 
                ? 'You will spend all your available USDC to buy SOL at the current market price.' 
                : 'You will sell all your available SOL at the current market price.'}
            </p>
            <p>
              <strong>Note:</strong> This is a simulated trade and does not use actual funds.
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </button>
          
          <button 
            className={`confirm-btn ${isBuy ? 'buy-btn' : 'sell-btn'}`}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Confirming...' : `Confirm ${isBuy ? 'Buy' : 'Sell'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeConfirmationModal;