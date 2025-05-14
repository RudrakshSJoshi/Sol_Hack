// controllers/agentController.js
const Agent = require('../models/Agent');
const { executeAgentFlow } = require('../services/agentService');

// Get all agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};

// Get agent by id
exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};

// Create new agent
exports.createAgent = async (req, res) => {
  try {
    const { name, description, modelId, memoryId, toolIds, strategyId } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    
    const agent = new Agent({
      name,
      description,
      modelId,
      memoryId,
      toolIds,
      strategyId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
};

// Update agent
exports.updateAgent = async (req, res) => {
  try {
    const { name, description, modelId, memoryId, toolIds, strategyId } = req.body;
    
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    agent.name = name || agent.name;
    agent.description = description || agent.description;
    agent.modelId = modelId || agent.modelId;
    agent.memoryId = memoryId || agent.memoryId;
    agent.toolIds = toolIds || agent.toolIds;
    agent.strategyId = strategyId || agent.strategyId;
    agent.updatedAt = new Date();
    
    await agent.save();
    res.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
};

// Delete agent
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await Agent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
};

// Execute agent
exports.executeAgent = async (req, res) => {
  try {
    const { input, parameters } = req.body;
    
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Execute the agent with the provided input
    const result = await executeAgentFlow(agent, input, parameters);
    
    res.json({ result });
  } catch (error) {
    console.error('Error executing agent:', error);
    res.status(500).json({ error: 'Failed to execute agent', details: error.message });
  }
};