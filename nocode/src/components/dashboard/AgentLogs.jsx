// src/components/dashboard/AgentLogs.jsx
import React, { useState, useEffect } from 'react';
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

const AgentLogs = ({ agent, logs = [] }) => {
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'info', 'warning', 'error'
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  // Generate mock logs for the demo
  useEffect(() => {
    if (logs && logs.length > 0) {
      setFilteredLogs(logs);
      return;
    }

    // If we don't have real logs, use mock logs
    const mockLogs = [
      { id: 1, timestamp: new Date().toISOString(), level: 'info', message: 'Initializing Solana trading agent' },
      { id: 2, timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', message: 'Connected to Solana network' },
      { id: 3, timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Retrieving SOL/USDC price' },
      { id: 4, timestamp: new Date(Date.now() - 90000).toISOString(), level: 'info', message: 'Current SOL price: $49.23' },
      { id: 5, timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warning', message: 'High market volatility detected' },
      { id: 6, timestamp: new Date(Date.now() - 180000).toISOString(), level: 'info', message: 'Analyzing trading opportunity' },
      { id: 7, timestamp: new Date(Date.now() - 240000).toISOString(), level: 'info', message: 'Buy signal detected at $48.95' },
      { id: 8, timestamp: new Date(Date.now() - 270000).toISOString(), level: 'info', message: 'Executing buy order for 2.04 SOL' },
      { id: 9, timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'Order executed successfully, new balance: 2.04 SOL' },
      { id: 10, timestamp: new Date(Date.now() - 360000).toISOString(), level: 'info', message: 'Monitoring SOL price movement...' },
      { id: 11, timestamp: new Date(Date.now() - 420000).toISOString(), level: 'error', message: 'API rate limit exceeded, retrying in 5 seconds' },
      { id: 12, timestamp: new Date(Date.now() - 480000).toISOString(), level: 'info', message: 'API connection restored' },
      { id: 13, timestamp: new Date(Date.now() - 600000).toISOString(), level: 'info', message: 'Sell signal detected at $50.12' },
      { id: 14, timestamp: new Date(Date.now() - 660000).toISOString(), level: 'info', message: 'Executing sell order for 1.0 SOL' },
      { id: 15, timestamp: new Date(Date.now() - 720000).toISOString(), level: 'info', message: 'Order executed, profit secured: +2.34 USDC' }
    ];
    
    setFilteredLogs(mockLogs);
  }, [logs]);

  // Filter logs by search query and level
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    const filtered = logs.filter(log => {
      const matchesSearch = !searchQuery || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filter === 'all' || log.level === filter;
      
      return matchesSearch && matchesFilter;
    });
    
    setFilteredLogs(filtered);
  }, [logs, searchQuery, filter]);

  const handleExportLogs = () => {
    // Format logs for export
    const logText = filteredLogs
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    // Create a blob and download
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-logs-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      setFilteredLogs([]);
    }
  };

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
              disabled={filteredLogs.length === 0}
            >
              <BsTrash />
            </button>
          </div>
        </div>
      </div>
      
      <div className="logs-container">
        {agent.status !== 'running' ? (
          <div className="logs-empty">
            <BsInfoCircle />
            <p>No logs available. Start the agent to see logs.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <BsInfoCircle />
            <p>No logs found {searchQuery ? 'matching your search' : ''}</p>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`log-entry ${log.level}`}>
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
          {filteredLogs.length > 0 && (
            <span>Showing {filteredLogs.length} log entries</span>
          )}
          {searchQuery && <span> | Filtered by: "{searchQuery}"</span>}
        </div>
      </div>
    </div>
  );
};

export default AgentLogs;