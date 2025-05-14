// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsRobot, 
  BsWallet2, 
  BsTerminal, 
  BsGear, 
  BsArrowRepeat, 
  BsPlay, 
  BsStop,
  BsClipboard,
  BsArrowLeft,
  BsSpeedometer2,
  BsCloudCheck,
  BsDatabase,
  BsHddNetwork,
  BsPeople,
  BsShieldCheck,
  BsCpu,
  BsCashCoin,
  BsBarChart,
  BsCodeSlash,
  BsLightning,
  BsHash,
  BsInfoCircle,
  BsExclamationTriangle,
  BsCheckCircle,
  BsCaretRightFill
} from 'react-icons/bs';
import '../styles/Dashboard.css';
import { useAgentStore } from '../store/agentStore';
import { useAuth } from '../contexts/AuthContext';
import AgentDetail from './dashboard/AgentDetail';
import AgentLogs from './dashboard/AgentLogs';
import AgentMetrics from './dashboard/AgentMetrics';
import AgentSettings from './dashboard/AgentSettings';
import Leaderboard from './dashboard/Leaderboard';

const Dashboard = ({ onSwitchToBuilder }) => {
  const [activeSection, setActiveSection] = useState('agents');
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [selectedView, setSelectedView] = useState('detail'); // 'detail', 'logs', 'metrics', 'settings'
  const [deploymentLogs, setDeploymentLogs] = useState([]);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState([
    { id: 'init', status: 'pending', message: 'Initializing deployment process...' },
    { id: 'compile', status: 'pending', message: 'Compiling graph to code...' },
    { id: 'dependencies', status: 'pending', message: 'Installing dependencies...' },
    { id: 'wallet', status: 'pending', message: 'Setting up agent wallet...' },
    { id: 'mcp', status: 'pending', message: 'Initializing Model Context Protocol...' },
    { id: 'deployment', status: 'pending', message: 'Deploying agent to SUI blockchain...' },
    { id: 'verification', status: 'pending', message: 'Verifying deployment...' },
    { id: 'complete', status: 'pending', message: 'Deployment complete!' }
  ]);
  
  const { 
    agents, 
    fetchAgents, 
    startAgent, 
    stopAgent, 
    createWallet, 
    getAgentLogs,
    isLoading 
  } = useAgentStore();
  
  const { uid, walletAddress } = useAuth();
  
  useEffect(() => {
    // Fetch initial agents data
    fetchAgents();
    
    // Set up polling interval to refresh agent data
    const interval = setInterval(() => {
      fetchAgents();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchAgents]);

  // Select the first agent when the list loads
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Handle agent deployment simulation
  const handleDeploy = async (agent) => {
    setShowDeploymentModal(true);
    
    // Reset deployment steps
    setDeploymentSteps(steps => steps.map(step => ({
      ...step,
      status: 'pending'
    })));
    
    // Clear deployment logs
    setDeploymentLogs([]);
    
    // Simulate deployment process with timed updates
    const updateStep = (stepId, status, message) => {
      setDeploymentSteps(steps => steps.map(step => {
        if (step.id === stepId) {
          return { ...step, status, message: message || step.message };
        }
        return step;
      }));
      
      // Add log entry
      setDeploymentLogs(logs => [
        ...logs, 
        { 
          timestamp: new Date().toISOString(), 
          message: message || deploymentSteps.find(s => s.id === stepId).message,
          type: status
        }
      ]);
    };
    
    // Simulate deployment steps with delays
    updateStep('init', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStep('init', 'complete');
    
    updateStep('compile', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStep('compile', 'complete', 'Graph successfully compiled to executable code.');
    
    updateStep('dependencies', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateStep('dependencies', 'complete', 'All dependencies installed successfully.');
    
    updateStep('wallet', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 2500));
    const mockWalletAddress = agent.walletAddress || ('0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join(''));
    updateStep('wallet', 'complete', `Agent wallet created: ${mockWalletAddress.substring(0, 8)}...${mockWalletAddress.substring(mockWalletAddress.length - 8)}`);
    
    updateStep('mcp', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Include UID in MCP initialization logs
    updateStep('mcp', 'complete', `Model Context Protocol initialized with UID: ${uid || 'No UID available'}`);
    
    updateStep('deployment', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 4000));
    updateStep('deployment', 'complete', `Agent deployed to SUI blockchain successfully with wallet: ${walletAddress ? walletAddress.substring(0, 8) + '...' : 'Not connected'}`);
    
    updateStep('verification', 'in-progress');
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStep('verification', 'complete');
    
    updateStep('complete', 'complete', '✅ Deployment completed successfully!');
    
    // Update agent status to running
    await startAgent(agent.id);
  };

  const handleCreateWallet = async (agentId) => {
    await createWallet(agentId);
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  const renderContent = () => {
    if (activeSection === 'agents') {
      return (
        <div className="dashboard-agents-container">
          <div className="agents-sidebar">
            <div className="agents-sidebar-header">
              <h2>My Agents</h2>
              <button 
                className="new-agent-btn"
                onClick={onSwitchToBuilder}
              >
                <BsPlus />
                New Agent
              </button>
            </div>
            <div className="agents-list">
              {agents.map(agent => (
                <div 
                  key={agent.id} 
                  className={`agent-list-item ${selectedAgentId === agent.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="agent-list-icon">
                    <BsRobot />
                  </div>
                  <div className="agent-list-details">
                    <div className="agent-list-name">{agent.name}</div>
                    <div className={`agent-list-status ${agent.status}`}>
                      {agent.status === 'running' ? (
                        <><span className="status-dot"></span> Running</>
                      ) : (
                        'Stopped'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedAgent ? (
            <div className="agent-detail-container">
              <div className="agent-detail-header">
                <div className="agent-header-info">
                  <h2>{selectedAgent.name}</h2>
                  <div className={`agent-header-status ${selectedAgent.status}`}>
                    {selectedAgent.status.charAt(0).toUpperCase() + selectedAgent.status.slice(1)}
                  </div>
                </div>
                <div className="agent-detail-tabs">
                  <button 
                    className={`tab-btn ${selectedView === 'detail' ? 'active' : ''}`}
                    onClick={() => setSelectedView('detail')}
                  >
                    <BsInfoCircle /> Overview
                  </button>
                  <button 
                    className={`tab-btn ${selectedView === 'logs' ? 'active' : ''}`}
                    onClick={() => setSelectedView('logs')}
                  >
                    <BsTerminal /> Logs
                  </button>
                  <button 
                    className={`tab-btn ${selectedView === 'metrics' ? 'active' : ''}`}
                    onClick={() => setSelectedView('metrics')}
                  >
                    <BsBarChart /> Metrics
                  </button>
                  <button 
                    className={`tab-btn ${selectedView === 'settings' ? 'active' : ''}`}
                    onClick={() => setSelectedView('settings')}
                  >
                    <BsGear /> Settings
                  </button>
                </div>
              </div>
              
              <div className="agent-detail-content">
                {selectedView === 'detail' && (
                  <AgentDetail 
                    agent={selectedAgent} 
                    onStartAgent={startAgent}
                    onStopAgent={stopAgent}
                    onCreateWallet={handleCreateWallet}
                    onDeploy={handleDeploy}
                  />
                )}
                
                {selectedView === 'logs' && (
                  <AgentLogs 
                    agent={selectedAgent}
                    getAgentLogs={getAgentLogs}
                  />
                )}
                
                {selectedView === 'metrics' && (
                  <AgentMetrics agent={selectedAgent} />
                )}
                
                {selectedView === 'settings' && (
                  <AgentSettings agent={selectedAgent} />
                )}
              </div>
            </div>
          ) : (
            <div className="no-agent-selected">
              <BsRobot className="big-icon" />
              <h3>No Agent Selected</h3>
              <p>Select an agent from the list or create a new one.</p>
              <button 
                className="create-agent-btn"
                onClick={onSwitchToBuilder}
              >
                Create New Agent
              </button>
            </div>
          )}
        </div>
      );
    } else if (activeSection === 'leaderboard') {
      return <Leaderboard />;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="back-btn" onClick={onSwitchToBuilder}>
          <BsArrowLeft /> Back to Flow Builder
        </button>
        <h1>DeFAI Agent Deployer</h1>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-label">SUI/USDC:</span>
            <span className="status-value">$0.942</span>
          </div>
          <div className="status-item">
            <span className="status-label">Active Agents:</span>
            <span className="status-value">{agents.filter(a => a.status === 'running').length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">MCP Status:</span>
            <span className="status-value online">
              <span className="status-dot"></span> Online
            </span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-navbar">
        <div 
          className={`nav-item ${activeSection === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveSection('agents')}
        >
          <BsRobot /> Agents
        </div>
        <div 
          className={`nav-item ${activeSection === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('leaderboard')}
        >
          <BsBarChart /> Leaderboard
        </div>
      </div>
      
      <div className="dashboard-content">
        {renderContent()}
      </div>

      {/* Deployment Progress Modal */}
      {showDeploymentModal && (
        <div className="modal-overlay">
          <div className="deployment-modal">
            <div className="modal-header">
              <h2>Deploying Agent</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDeploymentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="deployment-progress">
              {deploymentSteps.map(step => (
                <div 
                  key={step.id} 
                  className={`deployment-step ${step.status}`}
                >
                  <div className="step-status-icon">
                    {step.status === 'pending' && <div className="status-pending"></div>}
                    {step.status === 'in-progress' && <div className="status-in-progress"></div>}
                    {step.status === 'complete' && <BsCheckCircle />}
                    {step.status === 'error' && <BsExclamationTriangle />}
                  </div>
                  <div className="step-content">
                    <div className="step-message">{step.message}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="deployment-logs">
              <div className="logs-header">
                <h3>Deployment Logs</h3>
              </div>
              <div className="logs-content">
                {deploymentLogs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeploymentModal(false)}
              >
                Close
              </button>
              {deploymentSteps.find(step => step.id === 'complete').status === 'complete' && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowDeploymentModal(false);
                    // Any additional actions after successful deployment
                  }}
                >
                  Go to Agent
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const BsPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
  </svg>
);

export default Dashboard;