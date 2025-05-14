// src/components/dashboard/AgentLogs.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  BsTerminal, 
  BsExclamationTriangle, 
  BsInfoCircle, 
  BsDownload,
  BsFilter,
  BsSearch,
  BsTrash,
  BsArrowClockwise
} from 'react-icons/bs';
import '../../styles/AgentLogs.css';

const AgentLogs = ({ agent, getAgentLogs }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'info', 'warning', 'error'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef(null);
  
  const fetchLogs = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      const agentLogs = await getAgentLogs(agent.id);
      
      // Add some additional sample logs for demonstration
      const sampleLogs = [
        { id: 6, timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'Model Context Protocol initialized' },
        { id: 7, timestamp: new Date(Date.now() - 360000).toISOString(), level: 'info', message: 'Connected to SUI blockchain mainnet' },
        { id: 8, timestamp: new Date(Date.now() - 420000).toISOString(), level: 'warning', message: 'Market volatility detected, applying risk mitigation' },
        { id: 9, timestamp: new Date(Date.now() - 480000).toISOString(), level: 'info', message: 'Analyzed market data from SUI/USDC trading pair' },
        { id: 10, timestamp: new Date(Date.now() - 540000).toISOString(), level: 'error', message: 'Failed to execute trade: insufficient balance' },
        { id: 11, timestamp: new Date(Date.now() - 600000).toISOString(), level: 'info', message: 'Wallet balance updated: 2.45 SUI' },
        { id: 12, timestamp: new Date(Date.now() - 660000).toISOString(), level: 'info', message: 'Agent deployed successfully' },
        { id: 13, timestamp: new Date(Date.now() - 720000).toISOString(), level: 'info', message: 'Generating UID for agent: AbC12XyZ89' },
        { id: 14, timestamp: new Date(Date.now() - 780000).toISOString(), level: 'info', message: 'No-code graph successfully compiled to executable code' },
        { id: 15, timestamp: new Date(Date.now() - 840000).toISOString(), level: 'warning', message: 'Potential slippage detected in market price' }
      ];
      
      const mergedLogs = [...agentLogs, ...sampleLogs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setLogs(mergedLogs);
      setError(null);
    } catch (err) {
      setError('Failed to load agent logs. Please try again.');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [agent]);
  
  useEffect(() => {
    if (isAutoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLogs();
      }, 5000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAutoRefresh]);
  
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesFilter = filter === 'all' || log.level === filter;
      const matchesSearch = !searchQuery || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  };
  
  const handleExportLogs = () => {
    // Format logs for export
    const logText = getFilteredLogs()
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    // Create a blob and download
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.id}-logs-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      setLogs([]);
    }
  };
  
  const filteredLogs = getFilteredLogs();
  
  return (
    <div className="agent-logs">
      <div className="logs-header">
        <div className="logs-title">
          <BsTerminal />
          <h3>Agent Logs</h3>
        </div>
        
        <div className="logs-controls">
          <div className="log-filter">
            <BsFilter />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="log-search">
            <BsSearch />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="search-input"
            />
          </div>
          
          <div className="logs-actions">
            <button 
              className={`refresh-toggle ${isAutoRefresh ? 'active' : ''}`}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              title={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <BsArrowClockwise /> {isAutoRefresh ? 'Auto' : 'Manual'}
            </button>
            
            <button 
              className="export-btn"
              onClick={handleExportLogs}
              title="Export logs"
              disabled={filteredLogs.length === 0}
            >
              <BsDownload />
            </button>
            
            <button 
              className="clear-btn"
              onClick={handleClearLogs}
              title="Clear logs"
              disabled={logs.length === 0}
            >
              <BsTrash />
            </button>
          </div>
        </div>
      </div>
      
      <div className="logs-container">
        {loading ? (
          <div className="logs-loading">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : error ? (
          <div className="logs-error">
            <BsExclamationTriangle />
            <p>{error}</p>
            <button onClick={fetchLogs}>Try Again</button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <BsInfoCircle />
            <p>No logs found {searchQuery ? 'matching your search' : ''}</p>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map(log => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                <div className="log-timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-level">{log.level.toUpperCase()}</div>
                <div className="log-message">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="logs-footer">
        <div className="logs-stats">
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
          {searchQuery && <span> | Filtered by: "{searchQuery}"</span>}
        </div>
        
        <button 
          className="refresh-btn"
          onClick={fetchLogs}
          disabled={loading}
        >
          <BsArrowClockwise /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default AgentLogs;