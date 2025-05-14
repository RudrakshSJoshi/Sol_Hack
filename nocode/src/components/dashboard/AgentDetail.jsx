// src/components/dashboard/AgentDetail.jsx
import React, { useState } from 'react';
import { 
  BsRobot, 
  BsWallet2, 
  BsPlay, 
  BsStop, 
  BsCpu, 
  BsDatabase,
  BsTools,
  BsClock,
  BsClipboard,
  BsArrowRepeat,
  BsShieldCheck,
  BsLightning,
  BsCashCoin,
  BsHash
} from 'react-icons/bs';
import '../../styles/AgentDetail.css';

const AgentDetail = ({ agent, onStartAgent, onStopAgent, onCreateWallet, onDeploy }) => {
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const handleCreateWallet = async () => {
    setIsCreatingWallet(true);
    try {
      await onCreateWallet(agent.id);
    } finally {
      setIsCreatingWallet(false);
    }
  };
  
  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      if (agent.status === 'running') {
        await onStopAgent(agent.id);
      } else {
        await onStartAgent(agent.id);
      }
    } finally {
      setIsUpdatingStatus(false);
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
              <div className="item-value">{new Date(agent.created).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsClock /></div>
            <div className="item-content">
              <div className="item-label">Last Active</div>
              <div className="item-value">{new Date(agent.lastActive).toLocaleDateString()} {new Date(agent.lastActive).toLocaleTimeString()}</div>
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
            <div className="item-icon"><BsHash /></div>
            <div className="item-content">
              <div className="item-label">Agent UID</div>
              <div className="item-value">{agent.uid || 'Not authenticated'}</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="item-icon"><BsShieldCheck /></div>
            <div className="item-content">
              <div className="item-label">Status</div>
              <div className="item-value">{agent.status === 'running' ? 'Healthy' : 'Inactive'}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="detail-section wallet-info">
        <div className="section-header">
          <h3>Wallet Information</h3>
          {agent.walletStatus === 'active' ? (
            <span className="status-badge active">Active</span>
          ) : (
            <span className="status-badge pending">Pending</span>
          )}
        </div>
        
        {agent.walletStatus === 'active' ? (
          <div className="wallet-content">
            <div className="wallet-detail">
              <div className="wallet-detail-label">Wallet Address:</div>
              <div className="wallet-address">
                <span className="address-text">
                  {`${agent.walletAddress.substring(0, 12)}...${agent.walletAddress.substring(agent.walletAddress.length - 12)}`}
                </span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(agent.walletAddress)}
                  title="Copy address"
                >
                  <BsClipboard />
                </button>
              </div>
            </div>
            
            <div className="wallet-metrics">
              <div className="wallet-metric">
                <div className="metric-icon"><BsCashCoin /></div>
                <div className="metric-content">
                  <div className="metric-label">Balance</div>
                  <div className="metric-value">{agent.balance} SUI</div>
                </div>
              </div>
              
              <div className="wallet-metric">
                <div className="metric-icon"><BsArrowRepeat /></div>
                <div className="metric-content">
                  <div className="metric-label">Transactions</div>
                  <div className="metric-value">24</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-placeholder">
            <BsWallet2 className="wallet-icon" />
            <p>No wallet has been created for this agent yet.</p>
            <button 
              className="create-wallet-btn"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        )}
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
              <div className="component-details">SUI Trading API</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="detail-section agent-actions">
        <div className="section-header">
          <h3>Actions</h3>
        </div>
        
        <div className="action-buttons">
          {agent.walletStatus === 'active' ? (
            <>
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
              
              {agent.status !== 'running' && (
                <button 
                  className="action-btn deploy-btn"
                  onClick={() => onDeploy(agent)}
                >
                  <BsLightning /> Deploy & Run
                </button>
              )}
            </>
          ) : (
            <button 
              className="action-btn create-wallet-btn"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? 'Creating...' : <><BsWallet2 /> Create Wallet</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;