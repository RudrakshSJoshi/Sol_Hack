// models/Agent.js
const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  memoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory'
  },
  toolIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool'
  }],
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agent', AgentSchema);