// src/components/nodes/AgentNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow';
import { BsRobot } from 'react-icons/bs';
import '../../styles/Nodes.css';

const AgentNode = ({ data, id }) => {
  const [name, setName] = useState(data.name || '');
  const [description, setDescription] = useState(data.description || '');
  
  // Update handlers to directly modify the node data
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    data.name = newName; // Direct update to node data
  };
  
  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    data.description = newDescription; // Direct update to node data
  };
  
  return (
    <div className="custom-node agent-node" data-id={id}>
      <Handle
        type="target"
        position="left"
        id="agent-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsRobot className="node-icon" />
        <div className="node-title">AI Agent</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter agent name"
          />
        </div>
        <div className="input-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter agent description"
            rows={3}
          />
        </div>
      </div>
      
      {/* Connection points at the bottom with correct handle IDs */}
      <div className="connection-points">
        {/* Left connection point - Model */}
        <Handle
          type="source"
          position="bottom"
          id="model-out"  // Using consistent 'model-out' ID
          style={{ 
            left: '25%',
            background: 'var(--accent-primary)' 
          }}
        />
        
        {/* Middle connection point - Memory */}
        <Handle
          type="source"
          position="bottom"
          id="memory-out"  // Using consistent 'memory-out' ID
          style={{ 
            left: '50%',
            background: 'var(--accent-primary)' 
          }}
        />
        
        {/* Right connection point - Tool */}
        <Handle
          type="source"
          position="bottom"
          id="tool-out"  // Using consistent 'tool-out' ID
          style={{ 
            left: '75%',
            background: 'var(--accent-primary)' 
          }}
        />
      </div>
      
      <Handle
        type="source"
        position="right"
        id="agent-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default AgentNode;