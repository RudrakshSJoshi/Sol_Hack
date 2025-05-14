// src/services/agentDeploymentService.js
/**
 * Agent Deployment Service for DeFAI Agent Deployer
 * Handles two-phase agent deployment process:
 * - Phase 1: Update/Prepare agent configuration
 * - Phase 2: Deploy/Activate agent on blockchain
 */

// Use your API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Phase 1: Updates/prepares the agent with the flow configuration
 * @param {string} uid - The generated UID
 * @param {string} walletAddress - The connected wallet address (used as password)
 * @param {object} code - The exported JSON flow graph
 * @returns {Promise<{status: string, update?: boolean, message?: string}>}
 */
export const updateAgentConfiguration = async (uid, walletAddress, code) => {
  try {
    const requestBody = {
      uid: uid,
      password: walletAddress,
      code: code
    };
    
    console.log('=== PHASE 1: UPDATE AGENT CONFIGURATION ===');
    console.log('URL:', `${API_BASE_URL}/update`);
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
    });
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('=========================');
    
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response Body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('=== UPDATE RESPONSE ===');
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('Response Status:', data.status);
    console.log('Response Update:', data.update);
    console.log('Response Message:', data.message);
    console.log('==========================');
    
    // If the API response indicates an error, handle it
    if (data.status !== 'success') {
      throw new Error(data.message || 'Configuration update failed on server');
    }
    
    return data;
  } catch (error) {
    console.error('=== CONFIGURATION UPDATE ERROR ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('=======================');
    
    return {
      status: 'error',
      message: error.message || 'Failed to update agent configuration'
    };
  }
};

/**
 * Phase 2: Deploys/activates the agent on the blockchain (To be implemented)
 * @param {string} uid - The generated UID
 * @param {string} walletAddress - The connected wallet address
 * @param {object} deploymentData - Additional deployment data
 * @returns {Promise<{status: string, message?: string}>}
 */
export const activateAgent = async (uid, walletAddress, deploymentData) => {
  // TODO: Implement Phase 2 deployment/activation
  console.log('Phase 2: Agent activation not yet implemented');
  console.log('This will call the actual deployment endpoint with:', {
    uid,
    walletAddress,
    deploymentData
  });
  
  return {
    status: 'pending',
    message: 'Phase 2 deployment will be implemented later'
  };
};