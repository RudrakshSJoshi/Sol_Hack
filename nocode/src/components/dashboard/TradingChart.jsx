// src/components/dashboard/TradingChart.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsBarChart, 
  BsArrowUp, 
  BsArrowDown, 
  BsArrowRight, 
  BsGraphUp, 
  BsGraphDown
} from 'react-icons/bs';
import { useTradingStore } from '../../store/tradingStore';
import '../../styles/TradingChart.css';

const TradingChart = ({ agentLogs = [] }) => {
  const { solanaPrice, tradingHistory } = useTradingStore();
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('price');  // 'price' or 'volume'
  const [timeRange, setTimeRange] = useState('1h');     // '1h', '24h', '7d', '30d'
  
  // Generate sample data for chart visualization
  useEffect(() => {
    const generateChartData = () => {
      // The actual implementation would use real data
      // Here we'll generate synthetic data for demonstration
      const now = Date.now();
      const dataPoints = [];
      const timeRangeInMs = getTimeRangeInMs(timeRange);
      const startTime = now - timeRangeInMs;
      
      // Base price (use the current price if available)
      const basePrice = solanaPrice?.price || 50;
      
      // Generate data points
      const pointCount = getPointCountForTimeRange(timeRange);
      const pointInterval = timeRangeInMs / pointCount;
      
      let currentPrice = basePrice * 0.9; // Start slightly lower than current price
      
      for (let i = 0; i < pointCount; i++) {
        const timestamp = startTime + (i * pointInterval);
        
        // Add some randomness to the price movement
        // Also add a slight upward bias for realism
        const priceChange = (Math.random() - 0.48) * 0.5; // -0.24 to +0.26
        currentPrice += basePrice * priceChange;
        
        // Make sure price stays reasonable
        if (currentPrice < basePrice * 0.7) currentPrice = basePrice * 0.7;
        if (currentPrice > basePrice * 1.3) currentPrice = basePrice * 1.3;
        
        // Add the data point
        dataPoints.push({
          timestamp,
          price: currentPrice,
          volume: Math.random() * 1000 + 500
        });
      }
      
      // Incorporate trade history into the chart data
      tradingHistory.forEach(trade => {
        const tradeTime = new Date(trade.timestamp).getTime();
        if (tradeTime >= startTime && tradeTime <= now) {
          // Find the closest data point
          const closestIndex = Math.floor((tradeTime - startTime) / pointInterval);
          if (closestIndex >= 0 && closestIndex < dataPoints.length) {
            dataPoints[closestIndex].trade = trade;
          }
        }
      });
      
      // Add agent logs as decision points
      agentLogs.forEach(log => {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime >= startTime && logTime <= now) {
          // Find the closest data point
          const closestIndex = Math.floor((logTime - startTime) / pointInterval);
          if (closestIndex >= 0 && closestIndex < dataPoints.length) {
            // Only add interesting logs that represent decisions
            if (log.message.includes('buy') || 
                log.message.includes('sell') || 
                log.message.includes('hold') ||
                log.message.includes('analyzed')) {
              dataPoints[closestIndex].log = log;
            }
          }
        }
      });
      
      // Sort by timestamp (just in case)
      return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    };
    
    setChartData(generateChartData());
  }, [timeRange, solanaPrice, tradingHistory, agentLogs]);
  
  // Get time range in milliseconds
  const getTimeRangeInMs = (range) => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };
  
  // Get number of data points for the time range
  const getPointCountForTimeRange = (range) => {
    switch (range) {
      case '1h': return 60;           // One per minute
      case '24h': return 24 * 12;     // One per 5 minutes
      case '7d': return 7 * 24;       // One per hour
      case '30d': return 30 * 6;      // One per 4 hours
      default: return 60;
    }
  };
  
  // Get min and max values from chart data
  const getDataMinMax = () => {
    if (!chartData.length) return { min: 0, max: 100 };
    
    const values = chartData.map(point => chartType === 'price' ? point.price : point.volume);
    return {
      min: Math.min(...values) * 0.95,  // Add 5% padding
      max: Math.max(...values) * 1.05
    };
  };
  
  // Format time for chart labels
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString([], { hour: '2-digit' });
      case '30d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString();
    }
  };
  
  // Determine if a price is going up or down compared to previous
  const isPriceIncreasing = (index) => {
    if (index === 0) return true;
    return chartData[index].price > chartData[index - 1].price;
  };
  
  // Render chart lines
  const renderChartContent = () => {
    if (!chartData.length) return null;
    
    const { min, max } = getDataMinMax();
    const range = max - min;
    
    const getYPosition = (value) => {
      return 95 - ((value - min) / range * 90);  // Leave 5% margin top and bottom
    };
    
    // SVG path for the chart line
    let pathD = '';
    let areaPathD = '';
    
    // Create the price line
    chartData.forEach((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = getYPosition(chartType === 'price' ? point.price : point.volume);
      
      if (index === 0) {
        pathD += `M ${x} ${y}`;
        areaPathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaPathD += ` L ${x} ${y}`;
      }
    });
    
    // Complete the area path
    areaPathD += ` L ${100} ${95} L 0 ${95} Z`;
    
    // Determine chart color based on price trend
    const startPrice = chartData[0].price;
    const endPrice = chartData[chartData.length - 1].price;
    const isPriceUp = endPrice > startPrice;
    
    return (
      <div className="chart-visualization">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Chart area fill */}
          <path 
            d={areaPathD} 
            fill={isPriceUp ? "rgba(45, 206, 137, 0.2)" : "rgba(245, 54, 92, 0.2)"} 
            className="chart-area"
          />
          
          {/* Chart line */}
          <path 
            d={pathD} 
            stroke={isPriceUp ? "var(--success-color)" : "var(--danger-color)"}
            strokeWidth="0.5"
            fill="none"
            className="chart-line"
          />
          
          {/* Trade points */}
          {chartData.map((point, index) => {
            if (!point.trade) return null;
            
            const x = (index / (chartData.length - 1)) * 100;
            const y = getYPosition(chartType === 'price' ? point.price : point.volume);
            
            return (
              <circle 
                key={`trade-${index}`}
                cx={x}
                cy={y}
                r="1.5"
                fill={point.trade.action === 'buy' ? "var(--success-color)" : "var(--danger-color)"}
                className="trade-point"
                data-trade={JSON.stringify(point.trade)}
              />
            );
          })}
          
          {/* Agent log decision points */}
          {chartData.map((point, index) => {
            if (!point.log) return null;
            
            const x = (index / (chartData.length - 1)) * 100;
            const y = getYPosition(chartType === 'price' ? point.price : point.volume);
            
            // Determine the icon based on the log message
            let MarkerIcon = BsArrowRight;
            if (point.log.message.includes('buy')) {
              MarkerIcon = BsArrowUp;
            } else if (point.log.message.includes('sell')) {
              MarkerIcon = BsArrowDown;
            }
            
            return (
              <g 
                key={`log-${index}`}
                className="log-point"
                transform={`translate(${x}, ${y})`}
                data-log={point.log.message}
              >
                <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.7)" />
                <rect x="-1" y="-1" width="2" height="2" fill="transparent" />
              </g>
            );
          })}
        </svg>
        
        {/* Chart Y-axis labels */}
        <div className="chart-y-labels">
          <div className="y-label">{max.toFixed(2)}</div>
          <div className="y-label">{(min + range * 0.75).toFixed(2)}</div>
          <div className="y-label">{(min + range * 0.5).toFixed(2)}</div>
          <div className="y-label">{(min + range * 0.25).toFixed(2)}</div>
          <div className="y-label">{min.toFixed(2)}</div>
        </div>
        
        {/* Chart X-axis labels */}
        <div className="chart-x-labels">
          <div className="x-label">{formatTime(chartData[0].timestamp)}</div>
          <div className="x-label">{formatTime(chartData[Math.floor(chartData.length / 3)].timestamp)}</div>
          <div className="x-label">{formatTime(chartData[Math.floor(chartData.length * 2 / 3)].timestamp)}</div>
          <div className="x-label">{formatTime(chartData[chartData.length - 1].timestamp)}</div>
        </div>
        
        {/* Hover tooltip will be handled with JavaScript in a real implementation */}
      </div>
    );
  };
  
  // Render chart statistics
  const renderChartStats = () => {
    if (!chartData.length) return null;
    
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const priceChange = lastPrice - firstPrice;
    const percentChange = (priceChange / firstPrice) * 100;
    
    // Count trade types
    const buyCount = tradingHistory.filter(t => t.action === 'buy').length;
    const sellCount = tradingHistory.filter(t => t.action === 'sell').length;
    
    return (
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Change</span>
          <span className={`stat-value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">High</span>
          <span className="stat-value">
            {Math.max(...chartData.map(d => d.price)).toFixed(2)}
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Low</span>
          <span className="stat-value">
            {Math.min(...chartData.map(d => d.price)).toFixed(2)}
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Trades</span>
          <span className="stat-value">
            <span className="buy-count">{buyCount} buys</span>
            {' / '}
            <span className="sell-count">{sellCount} sells</span>
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="trading-chart">
      <div className="chart-header">
        <div className="chart-title">
          <BsBarChart />
          <h3>Trading Chart</h3>
        </div>
        
        <div className="chart-controls">
          <div className="chart-type-selector">
            <button 
              className={`type-btn ${chartType === 'price' ? 'active' : ''}`}
              onClick={() => setChartType('price')}
            >
              <BsGraphUp /> Price
            </button>
            <button 
              className={`type-btn ${chartType === 'volume' ? 'active' : ''}`}
              onClick={() => setChartType('volume')}
            >
              <BsBarChart /> Volume
            </button>
          </div>
          
          <div className="time-range-selector">
            <button 
              className={`range-btn ${timeRange === '1h' ? 'active' : ''}`}
              onClick={() => setTimeRange('1h')}
            >
              1H
            </button>
            <button 
              className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
              onClick={() => setTimeRange('24h')}
            >
              24H
            </button>
            <button 
              className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </button>
            <button 
              className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </button>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        {renderChartContent()}
      </div>
      
      {renderChartStats()}
      
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-marker buy-marker"></div>
          <span>Buy</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker sell-marker"></div>
          <span>Sell</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker decision-marker"></div>
          <span>Agent Decision</span>
        </div>
      </div>
      
      <div className="chart-disclaimer">
        Chart data is simulated for demonstration purposes. In a production environment, real-time price data would be used.
      </div>
    </div>
  );
};

export default TradingChart;