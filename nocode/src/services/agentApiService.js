// src/services/agentApiService.js
/**
 * Agent API Service for DeFAI Agent Deployer
 * Handles interaction with the agent deployment API
 */

// Use your API base URL - update this to your actual endpoint
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Gets a UID for the agent using the wallet address
 * @param {string} walletAddress - The connected wallet address
 * @returns {Promise<{status: string, uid?: string, message?: string}>}
 */
export const getAgentUid = async (walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_uid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: walletAddress
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error getting UID:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};

/**
 * Updates the agent configuration
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @param {object} code - The agent code/configuration
 * @returns {Promise<{status: string, update?: boolean, message?: string}>}
 */
export const updateAgentConfiguration = async (uid, walletAddress, code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        password: walletAddress,
        code: code
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error updating agent configuration:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};

/**
 * Deploys the agent with trading parameters
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @param {object} tradingParams - Trading parameters
 * @param {number} tradingParams.profit - Profit target (decimal)
 * @param {number} tradingParams.loss - Stop loss (decimal)
 * @param {string} tradingParams.risk - Risk level ('low', 'medium', 'high')
 * @returns {Promise<{status: string, message?: string}>}
 */
export const deployAgent = async (uid, walletAddress, tradingParams) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        password: walletAddress,
        profit: tradingParams.profit,
        loss: tradingParams.loss,
        risk: tradingParams.risk
      }),
    });

    // The deploy endpoint should return a streaming response
    // For demonstration, we'll assume a normal JSON response
    return await response.json();
  } catch (error) {
    console.error('Error deploying agent:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};

/**
 * Stops the agent execution
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, message?: string}>}
 */
export const stopAgent = async (uid, walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stop_execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        password: walletAddress
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error stopping agent:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};

/**
 * Fetches agent logs
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, log?: string, message?: string}>}
 */
export const fetchAgentLogs = async (uid, walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        password: walletAddress
      }),
    });

    const data = await response.json();
    
    // Parse logs from raw string to structured data
    if (data.status === 'success' && data.log) {
      // Split log into lines and parse each line
      const logLines = data.log.split('\n').filter(line => line.trim());
      
      const parsedLogs = logLines.map((line, index) => {
        // Parse timestamp and message from log line
        // Format might vary, adapt as needed
        const timestampMatch = line.match(/\[(.*?)\]/);
        const timestamp = timestampMatch 
          ? new Date(timestampMatch[1]).toISOString() 
          : new Date().toISOString();
        
        const message = line.replace(/\[.*?\]/, '').trim();
        
        return {
          id: `log-${index}`,
          timestamp,
          message
        };
      });
      
      return {
        status: 'success',
        logs: parsedLogs
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};

/**
 * Fetches data about all agent deployments
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, data?: Array, message?: string}>}
 */
export const fetchAgentData = async (walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: walletAddress
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching agent data:', error);
    return {
      status: 'error',
      message: 'Failed to connect to agent service'
    };
  }
};