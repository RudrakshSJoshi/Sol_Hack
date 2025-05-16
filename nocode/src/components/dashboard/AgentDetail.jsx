// src/components/dashboard/AgentDetail.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsRobot, 
  BsPlay, 
  BsStop, 
  BsCpu, 
  BsDatabase,
  BsTools,
  BsClock,
  BsLightning,
  BsCashCoin
} from 'react-icons/bs';
import '../../styles/AgentDetail.css';
import { 
  fetchTradingBalances, 
  deployAgent, 
  setInitialTrading, 
  stopAgent 
} from '../../services/agentDeploymentService';
import { useAuth } from '../../contexts/AuthContext';
import TradingModal from '../modals/TradingModal';

const AgentDetail = ({ agent, onAgentStop, onAgentStart }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [balances, setBalances] = useState({ sol: 0, usdc: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [tradingParams, setTradingParams] = useState({
    startingAmount: 100,
    profit: 0.1,
    loss: 0.05,
    risk: 'med'
  });
  
  const { uid, walletAddress } = useAuth();

  // Fetch initial balances
  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTradingBalances(walletAddress);
        if (result.status === 'success') {
          setBalances(result.balances);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
    // Set up polling interval
    const interval = setInterval(fetchBalances, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [walletAddress]);

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      if (agent.status === 'running') {
        // Stop agent
        await stopAgent(uid, walletAddress);
        if (onAgentStop) onAgentStop();
      } else {
        // Show trading modal to start agent
        setShowTradingModal(true);
      }
    } catch (error) {
      console.error('Error updating agent status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartAgent = async (params) => {
    setIsUpdatingStatus(true);
    try {
      // Step 1: Set initial trading amounts
      await setInitialTrading(params.startingAmount, walletAddress);

      // Step 2: Deploy agent with trading parameters
      await deployAgent(uid, walletAddress, {
        profit: params.profit,
        loss: params.loss,
        risk: params.risk
      });

      // Update UI
      if (onAgentStart) onAgentStart();
    } catch (error) {
      console.error('Error starting agent:', error);
    } finally {
      setIsUpdatingStatus(false);
      setShowTradingModal(false);
    }
  };

  return (
    <div className="agent-detail">
      <div className="detail-section agent-overview">
        <div className="section-header">
          <h3>Agent Overview</h3>
          {agent.status === 'running' ? (
            <span className="status-badge running">
              <span className="status-dot"></span> Running
            </span>
          ) : (
            <span className="status-badge stopped">Stopped</span>
          )}
        </div>
        
        <div className="overview-grid">
          <div className="overview-item">
            <div className="item-icon"><BsClock /></div>
            <div className="item-content">
              <div className="item-label">Created</div>
              <div className="item-value">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsClock /></div>
            <div className="item-content">
              <div className="item-label">Last Active</div>
              <div className="item-value">{agent.status === 'running' ? 'Now' : 'N/A'}</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsLightning /></div>
            <div className="item-content">
              <div className="item-label">Uptime</div>
              <div className="item-value">{agent.status === 'running' ? '4h 23m' : 'N/A'}</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsCashCoin /></div>
            <div className="item-content">
              <div className="item-label">SOL Balance</div>
              <div className="item-value">{balances.sol} SOL</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsCashCoin /></div>
            <div className="item-content">
              <div className="item-label">USDC Balance</div>
              <div className="item-value">{balances.usdc} USDC</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="detail-section agent-components">
        <div className="section-header">
          <h3>Agent Components</h3>
        </div>
        
        <div className="components-grid">
          <div className="component-card">
            <div className="component-icon"><BsCpu /></div>
            <div className="component-info">
              <div className="component-name">AI Model</div>
              <div className="component-details">Claude 3 Opus</div>
            </div>
          </div>
          
          <div className="component-card">
            <div className="component-icon"><BsDatabase /></div>
            <div className="component-info">
              <div className="component-name">Memory</div>
              <div className="component-details">Long-term Redis Store</div>
            </div>
          </div>
          
          <div className="component-card">
            <div className="component-icon"><BsTools /></div>
            <div className="component-info">
              <div className="component-name">Tools</div>
              <div className="component-details">Solana Trading API</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="detail-section agent-actions">
        <div className="section-header">
          <h3>Actions</h3>
        </div>
        
        <div className="action-buttons">
          <button 
            className={`action-btn ${agent.status === 'running' ? 'stop-btn' : 'start-btn'}`}
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              'Updating...'
            ) : agent.status === 'running' ? (
              <><BsStop /> Stop Agent</>
            ) : (
              <><BsPlay /> Start Agent</>
            )}
          </button>
        </div>
      </div>

      {/* Trading Parameters Modal */}
      {showTradingModal && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => setShowTradingModal(false)}
          onSubmit={handleStartAgent}
          initialParams={tradingParams}
        />
      )}
    </div>
  );
};

export default AgentDetail;