// src/components/dashboard/AgentSettings.jsx
import React, { useState } from 'react';
import { 
  BsGear, 
  BsPercent, 
  BsShieldExclamation, 
  BsArrowDownUp,
  BsInfoCircle,
  BsRocket
} from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AgentTrading.css';

// Component for setting up and deploying the AI trading agent
const AgentTradingSettings = ({ onStartAgent }) => {
  const { uid, walletAddress } = useAuth();
  
  // Define states for form inputs
  const [profitTarget, setProfitTarget] = useState(10); // 10% default
  const [stopLoss, setStopLoss] = useState(5);          // 5% default
  const [riskLevel, setRiskLevel] = useState('medium');  // 'low', 'medium', 'high'
  const [isDeploying, setIsDeploying] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'deploying', 'running', 'error'
  const [error, setError] = useState(null);
  
  // Handle start agent with trading parameters
  const handleStartAgent = async () => {
    setIsDeploying(true);
    setStatus('deploying');
    setError(null);
    
    try {
      // In a real app, this would be the API call to the agent service
      // Example: await deployAgent({ profit: profitTarget, loss: stopLoss, risk: riskLevel });
      
      // For now, simulate an API call with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the parent's onStartAgent function with the settings
      await onStartAgent({
        uid,
        walletAddress,
        settings: {
          profit: profitTarget / 100, // Convert to decimal
          loss: stopLoss / 100,      // Convert to decimal
          risk: riskLevel
        }
      });
      
      setStatus('running');
    } catch (err) {
      console.error('Failed to deploy agent:', err);
      setError(err.message || 'Failed to deploy agent');
      setStatus('error');
    } finally {
      setIsDeploying(false);
    }
  };
  
  // Create info tooltip for risk levels
  const getRiskDescription = (level) => {
    switch (level) {
      case 'low':
        return 'Conservative trading with fewer trades and smaller positions. Prioritizes capital preservation.';
      case 'medium':
        return 'Balanced approach with moderate trading frequency and position sizes. Aims for steady growth.';
      case 'high':
        return 'Aggressive trading with higher frequency and larger positions. Higher potential returns but more risk.';
      default:
        return '';
    }
  };
  
  return (
    <div className="agent-trading-settings">
      <div className="settings-header">
        <h3><BsGear /> Agent Trading Settings</h3>
      </div>
      
      <div className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="profit-target">
              <BsPercent /> Profit Target
            </label>
            <div className="input-with-suffix">
              <input
                id="profit-target"
                type="number"
                min="1"
                max="100"
                value={profitTarget}
                onChange={(e) => setProfitTarget(Number(e.target.value))}
                disabled={status === 'running' || isDeploying}
              />
              <span className="input-suffix">%</span>
            </div>
            <div className="form-help">
              Take profit when this percentage gain is reached
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="stop-loss">
              <BsShieldExclamation /> Stop Loss
            </label>
            <div className="input-with-suffix">
              <input
                id="stop-loss"
                type="number"
                min="1"
                max="50"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                disabled={status === 'running' || isDeploying}
              />
              <span className="input-suffix">%</span>
            </div>
            <div className="form-help">
              Exit position when this percentage loss is reached
            </div>
          </div>
        </div>
        
        <div className="form-group risk-group">
          <label>
            <BsArrowDownUp /> Risk Level
          </label>
          <div className="risk-selector">
            <button
              className={`risk-btn ${riskLevel === 'low' ? 'active' : ''}`}
              onClick={() => setRiskLevel('low')}
              disabled={status === 'running' || isDeploying}
            >
              Low
            </button>
            <button
              className={`risk-btn ${riskLevel === 'medium' ? 'active' : ''}`}
              onClick={() => setRiskLevel('medium')}
              disabled={status === 'running' || isDeploying}
            >
              Medium
            </button>
            <button
              className={`risk-btn ${riskLevel === 'high' ? 'active' : ''}`}
              onClick={() => setRiskLevel('high')}
              disabled={status === 'running' || isDeploying}
            >
              High
            </button>
          </div>
          <div className="form-help risk-description">
            {getRiskDescription(riskLevel)}
          </div>
        </div>
        
        <div className="agent-status">
          {status === 'idle' && (
            <div className="status-indicator idle">
              <BsInfoCircle /> Agent Ready to Deploy
            </div>
          )}
          
          {status === 'deploying' && (
            <div className="status-indicator deploying">
              <div className="loading-spinner"></div>
              Deploying Agent...
            </div>
          )}
          
          {status === 'running' && (
            <div className="status-indicator running">
              <div className="status-dot"></div>
              Agent Running
            </div>
          )}
          
          {status === 'error' && (
            <div className="status-indicator error">
              <BsShieldExclamation /> {error || 'Deployment Error'}
            </div>
          )}
        </div>
        
        {status !== 'running' && (
          <button
            className="deploy-agent-btn"
            onClick={handleStartAgent}
            disabled={isDeploying || !uid || !walletAddress}
          >
            <BsRocket /> {isDeploying ? 'Deploying...' : 'Deploy Trading Agent'}
          </button>
        )}
        
        {(!uid || !walletAddress) && (
          <div className="wallet-warning">
            <BsShieldExclamation />
            <span>Wallet authentication required to deploy agent</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentTradingSettings;