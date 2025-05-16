// src/components/dashboard/AgentSettings.jsx
import React, { useState } from 'react';
import { 
  BsGear, 
  BsSave, 
  BsTrash, 
  BsExclamationTriangle,
  BsShieldLock,
  BsBriefcase,
  BsRobot
} from 'react-icons/bs';
import '../../styles/AgentSettings.css';
import { useAuth } from '../../contexts/AuthContext';

const AgentSettings = ({ agent }) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || 'Automated trading agent for SOL/USDC');
  const [maxTradeAmount, setMaxTradeAmount] = useState(agent?.maxTradeAmount || '10');
  const [riskLevel, setRiskLevel] = useState(agent?.riskLevel || 'medium');
  const [autoRestart, setAutoRestart] = useState(agent?.autoRestart || true);
  const [notifyOnTrade, setNotifyOnTrade] = useState(agent?.notifyOnTrade || false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { uid, walletAddress } = useAuth();
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAgent = async () => {
    // In a real app, this would be an API call
    
    alert('Agent deleted!');
    setShowConfirmDelete(false);
  };
  
  // If agent is running, show limited settings
  const isAgentRunning = agent?.status === 'running';
  
  return (
    <div className="agent-settings">
      <div className="settings-header">
        <h3><BsGear /> Agent Settings</h3>
      </div>
      
      {isAgentRunning ? (
        <div className="settings-locked-message">
          <BsExclamationTriangle />
          <div>
            <h4>Agent Currently Running</h4>
            <p>Stop the agent to modify settings.</p>
          </div>
        </div>
      ) : null}
      
      <div className="settings-sections">
        <div className="settings-section">
          <div className="section-header">
            <h4><BsRobot /> Basic Settings</h4>
            <p>Configure the general settings for your agent</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="agent-name">Agent Name</label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
              disabled={isAgentRunning}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="agent-description">Description</label>
            <textarea
              id="agent-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description for this agent"
              rows={3}
              disabled={isAgentRunning}
            />
          </div>
        </div>
        
        <div className="settings-section">
          <div className="section-header">
            <h4><BsBriefcase /> Trading Parameters</h4>
            <p>Configure how your agent will trade</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="max-trade">Maximum Trade Amount (SOL)</label>
            <input
              id="max-trade"
              type="number"
              min="0.01"
              step="0.01"
              value={maxTradeAmount}
              onChange={(e) => setMaxTradeAmount(e.target.value)}
              disabled={isAgentRunning}
            />
            <p className="help-text">Maximum amount of SOL to trade in a single transaction.</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="risk-level">Risk Level</label>
            <select
              id="risk-level"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              disabled={isAgentRunning}
            >
              <option value="low">Low Risk</option>
              <option value="med">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <p className="help-text">Determines the aggressiveness of trading strategies.</p>
          </div>
        </div>
        
        <div className="settings-section">
          <div className="section-header">
            <h4><BsShieldLock /> Security & Authentication</h4>
            <p>Security settings and authentication information</p>
          </div>
          
          <div className="wallet-info">
            <div className="wallet-detail">
              <span className="detail-label">UID:</span>
              <span className="detail-value">{uid || 'Not authenticated'}</span>
            </div>
            
            <div className="wallet-detail">
              <span className="detail-label">Wallet Address:</span>
              <span className="detail-value">
                {walletAddress ? 
                  `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}` : 
                  'Not connected'
                }
              </span>
            </div>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoRestart}
                onChange={(e) => setAutoRestart(e.target.checked)}
                disabled={isAgentRunning}
              />
              Auto-restart on error
            </label>
            <p className="help-text">Automatically restart the agent if it encounters an error.</p>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={notifyOnTrade}
                onChange={(e) => setNotifyOnTrade(e.target.checked)}
              />
              Notify on trade execution
            </label>
            <p className="help-text">Receive notifications when trades are executed.</p>
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button 
          className="save-btn"
          onClick={handleSaveSettings}
          disabled={isSaving || isAgentRunning}
        >
          <BsSave /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        
        <button 
          className="delete-btn"
          onClick={() => setShowConfirmDelete(true)}
          disabled={isAgentRunning}
        >
          <BsTrash /> Delete Agent
        </button>
      </div>
      
      {showConfirmDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <div className="modal-header">
              <BsExclamationTriangle className="warning-icon" />
              <h3>Confirm Deletion</h3>
            </div>
            
            <p>Are you sure you want to delete this agent? This action cannot be undone.</p>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              
              <button 
                className="confirm-btn"
                onClick={handleDeleteAgent}
              >
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSettings;