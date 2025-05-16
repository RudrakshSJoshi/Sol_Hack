// src/components/modals/AgentPerformanceModal.jsx
import React, { useState, useEffect } from 'react';
import { BsXLg, BsArrowUp, BsArrowDown, BsArrowRight } from 'react-icons/bs';
import '../../styles/Modals.css';
import { fetchPairStatus } from '../../services/agentDeploymentService';

const AgentPerformanceModal = ({ isOpen, onClose, agentLogs = [], tradingData = {} }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [balances, setBalances] = useState({ sol: 0, usdc: 0 });
  
  useEffect(() => {
    // Generate initial performance data when modal opens
    if (isOpen) {
      generatePerformanceData();
      
      // Set up an interval to update the chart
      const interval = setInterval(() => {
        updatePerformanceData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Fetch latest balances
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const result = await fetchPairStatus();
        if (result.status === 'success') {
          setBalances({
            sol: result.data.sol || 0,
            usdc: result.data.usdc || 0
          });
        }
      } catch (error) {
        console.error('Error fetching latest data:', error);
      }
    };

    if (isOpen) {
      fetchLatestData();
      const interval = setInterval(fetchLatestData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Initial data generation
  const generatePerformanceData = () => {
    const now = Date.now();
    const data = [];
    
    // Generate data points for the last 24 hours with 1-hour intervals
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - (i * 3600000);
      // Start with a value of 100 and add some randomness
      const value = 100 + (Math.random() * 5 - 2.5) * (24 - i) / 3;
      const action = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'hold';
      
      data.push({
        timestamp,
        value,
        action
      });
    }
    
    setPerformanceData(data);
  };

  // Update data with new points
  const updatePerformanceData = () => {
    setPerformanceData(prevData => {
      if (prevData.length === 0) return prevData;
      
      // Take the last data point
      const lastPoint = prevData[prevData.length - 1];
      const newTimestamp = Date.now();
      
      // Generate a new value with some random change
      const change = (Math.random() * 2 - 1) * 2;
      const newValue = lastPoint.value + change;
      
      // Randomly determine action
      const action = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'hold';
      
      // Add the new point
      const newData = [...prevData, {
        timestamp: newTimestamp,
        value: newValue,
        action
      }];
      
      // Remove oldest point if we have more than 25
      if (newData.length > 25) {
        return newData.slice(1);
      }
      
      return newData;
    });
  };

  // Calculate stats
  const calculateStats = () => {
    if (performanceData.length < 2) return { change: 0, percentage: 0 };
    
    const firstValue = performanceData[0].value;
    const currentValue = performanceData[performanceData.length - 1].value;
    const change = currentValue - firstValue;
    const percentage = (change / firstValue) * 100;
    
    return { change, percentage };
  };

  const stats = calculateStats();
  const isPositive = stats.change >= 0;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="performance-modal">
        <div className="modal-header">
          <h3>Agent Performance</h3>
          <button className="close-btn" onClick={onClose}>
            <BsXLg />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="performance-summary">
            <div className="performance-stat">
              <span className="stat-label">Portfolio Value</span>
              <span className="stat-value">${(balances.sol * tradingData.currentPrice + balances.usdc).toFixed(2)}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Performance</span>
              <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <BsArrowUp /> : <BsArrowDown />}
                {Math.abs(stats.percentage).toFixed(2)}%
              </span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">SOL Balance</span>
              <span className="stat-value">{balances.sol} SOL</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">USDC Balance</span>
              <span className="stat-value">{balances.usdc} USDC</span>
            </div>
          </div>
          
          <div className="performance-content">
            <div className="chart-container">
              <h4>Trading Performance</h4>
              <div className="performance-chart">
                {performanceData.length > 0 && (
                  <>
                    {/* Create chart here */}
                    <svg width="100%" height="200" className="line-chart">
                      {/* Chart implementation */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#5e72e4" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#5e72e4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Generate a simple sparkline chart */}
                      {performanceData.length > 1 && (
                        <>
                          {/* Create a path for the line */}
                          <path
                            d={generateChartPath(performanceData)}
                            fill="none"
                            stroke="#5e72e4"
                            strokeWidth="2"
                          />
                          
                          {/* Area under the line */}
                          <path
                            d={generateAreaPath(performanceData)}
                            fill="url(#chartGradient)"
                          />
                          
                          {/* Add points for actions */}
                          {performanceData.map((point, index) => {
                            if (point.action !== 'hold') {
                              const { x, y } = getPointCoordinates(performanceData, index);
                              const color = point.action === 'buy' ? '#2dce89' : '#f5365c';
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill={color}
                                  stroke="#fff"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </>
                      )}
                    </svg>
                  </>
                )}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-marker buy"></span>
                  <span className="legend-label">Buy</span>
                </div>
                <div className="legend-item">
                  <span className="legend-marker sell"></span>
                  <span className="legend-label">Sell</span>
                </div>
                <div className="legend-item">
                  <span className="legend-marker line"></span>
                  <span className="legend-label">Portfolio Value</span>
                </div>
              </div>
            </div>
            
            <div className="logs-container">
              <h4>Agent Logs</h4>
              <div className="real-time-logs">
                {agentLogs.length > 0 ? (
                  <div className="logs-list">
                    {agentLogs.map((log, index) => (
                      <div key={index} className="log-entry">
                        <span className="log-timestamp">{new Date().toLocaleTimeString()}</span>
                        <span className="log-message">{log}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-logs">
                    <p>Waiting for agent activity...</p>
                    <div className="loading-indicator"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate chart path
const generateChartPath = (data) => {
  if (!data || data.length < 2) return '';
  
  // Find min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  
  // Scale function to convert value to y coordinate
  const scaleY = (value) => {
    return 180 - ((value - minValue) / (range || 1)) * 160;
  };
  
  // First point
  const width = 100; // percentage width
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = scaleY(d.value);
    return { x, y };
  });
  
  // Create the path
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
};

// Helper function to generate area path (for fill)
const generateAreaPath = (data) => {
  if (!data || data.length < 2) return '';
  
  // Find min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  
  // Scale function to convert value to y coordinate
  const scaleY = (value) => {
    return 180 - ((value - minValue) / (range || 1)) * 160;
  };
  
  // Points
  const width = 100; // percentage width
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = scaleY(d.value);
    return { x, y };
  });
  
  // Create the path
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  // Complete the area by adding bottom corners
  path += ` L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;
  
  return path;
};

// Helper function to get point coordinates
const getPointCoordinates = (data, index) => {
  // Find min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  
  // Scale function to convert value to y coordinate
  const scaleY = (value) => {
    return 180 - ((value - minValue) / (range || 1)) * 160;
  };
  
  const width = 100; // percentage width
  const x = (index / (data.length - 1)) * width;
  const y = scaleY(data[index].value);
  
  return { x, y };
};

export default AgentPerformanceModal;