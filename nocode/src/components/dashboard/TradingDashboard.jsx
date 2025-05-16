// src/components/dashboard/TradingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsWallet2, 
  BsGraphUp, 
  BsRobot, 
  BsTerminal, 
  BsCheckCircle,
  BsExclamationTriangle,
  BsGear,
  BsArrowLeft
} from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';
import { useTradingStore } from '../../store/tradingStore';
import { useAgentStore } from '../../store/agentStore';
import TradingPanel from './TradingPanel';
import TradingChart from './TradingChart';
import AgentTradingSettings from './AgentTradingSettings';
import AgentTradingLogs from './AgentLogs';
import '../../styles/TradingDashboard.css';

const TradingDashboard = ({ onSwitchToBuilder }) => {
  const { uid, walletAddress } = useAuth();
  
  const { 
    wallet,
    balances,
    solanaPrice,
    createWallet,
    getPrice,
    checkBalances,
    fetchPair,
    startPriceFetching,
    stopPriceFetching
  } = useTradingStore();
  
  const {
    agentUid,
    agentStatus,
    agentLogs,
    deployAgent,
    stopAgent,
    error: agentError
  } = useAgentStore();
  
  // Define states
  const [balanceRefreshInterval, setBalanceRefreshInterval] = useState(null);
  
  // Initialize data fetching
  useEffect(() => {
    // Initialize price fetching
    startPriceFetching();
    
    // Set up a refresh interval for balance checking
    const interval = setInterval(() => {
      if (wallet?.address) {
        fetchPair();
      }
    }, 30000); // Refresh every 30 seconds
    
    setBalanceRefreshInterval(interval);
    
    // Fetch initial data
    fetchInitialData();
    
    // Cleanup on unmount
    return () => {
      stopPriceFetching();
      if (balanceRefreshInterval) {
        clearInterval(balanceRefreshInterval);
      }
    };
  }, [wallet]);
  
  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      // Get current price
      await getPrice();
      
      // If wallet already exists, fetch balances
      if (wallet?.address) {
        await fetchPair();
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };
  
  // Handle agent deployment
  const handleStartAgent = async (deployParams) => {
    try {
      // Deploy the agent
      await deployAgent(deployParams.walletAddress, deployParams.settings);
      
      // Refresh data after deployment
      await fetchPair();
      
      return true;
    } catch (error) {
      console.error('Error deploying agent:', error);
      return false;
    }
  };
  
  // Handle agent stopping
  const handleStopAgent = async () => {
    try {
      await stopAgent(walletAddress);
      return true;
    } catch (error) {
      console.error('Error stopping agent:', error);
      return false;
    }
  };
  
  return (
    <div className="trading-dashboard">
      <div className="dashboard-header">
        <button className="back-btn" onClick={onSwitchToBuilder}>
          <BsArrowLeft /> Back to Flow Builder
        </button>
        <h1>DeFAI Trading Dashboard</h1>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-label">SOL/USDC:</span>
            <span className="status-value">${solanaPrice?.price ? solanaPrice.price.toFixed(2) : '0.00'}</span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Wallet:</span>
            <span className="status-value">
              {wallet ? (
                <span className="status-connected">
                  <span className="status-dot"></span> Connected
                </span>
              ) : (
                'Not Connected'
              )}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Agent:</span>
            <span className="status-value">
              {agentStatus === 'running' ? (
                <span className="status-active">
                  <span className="status-dot"></span> Running
                </span>
              ) : (
                'Idle'
              )}
            </span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="trading-grid">
          {/* Trading Panel */}
          <div className="trading-panel-container">
            <TradingPanel />
          </div>
          
          {/* Trading Chart */}
          <div className="chart-container">
            <TradingChart agentLogs={agentLogs} />
          </div>
          
          {/* Agent Settings */}
          <div className="agent-settings-container">
            <AgentTradingSettings 
              onStartAgent={handleStartAgent} 
            />
          </div>
          
          {/* Agent Logs */}
          <div className="agent-logs-container">
            <AgentTradingLogs 
              logs={agentLogs} 
              isAgentRunning={agentStatus === 'running'}
            />
          </div>
        </div>
      </div>
      
      {/* Notification area for status messages */}
      {agentError && (
        <div className="notification error">
          <BsExclamationTriangle />
          <span>{agentError}</span>
        </div>
      )}
      
      {agentStatus === 'running' && (
        <div className="notification success">
          <BsCheckCircle />
          <span>Trading agent is active and monitoring the market</span>
          <button className="stop-agent-btn" onClick={handleStopAgent}>
            Stop Agent
          </button>
        </div>
      )}
    </div>
  );
};

export default TradingDashboard;