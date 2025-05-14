// routes/flowRoutes.js
const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');

// Get all flows
router.get('/', flowController.getAllFlows);

// Get flow by id
router.get('/:id', flowController.getFlowById);

// Create new flow
router.post('/', flowController.createFlow);

// Update flow
router.put('/:id', flowController.updateFlow);

// Delete flow
router.delete('/:id', flowController.deleteFlow);

// Execute flow
router.post('/:id/execute', flowController.executeFlow);

// Save flow as template
router.post('/:id/template', flowController.saveAsTemplate);

// Get flow templates
router.get('/templates', flowController.getTemplates);

module.exports = router;