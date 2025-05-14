// models/Flow.js
const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  parentId: {
    type: String,
    default: null
  }
});

const EdgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  sourceHandle: {
    type: String,
    default: null
  },
  targetHandle: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'default'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const FlowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  nodes: {
    type: [NodeSchema],
    default: []
  },
  edges: {
    type: [EdgeSchema],
    default: []
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

module.exports = mongoose.model('Flow', FlowSchema);
