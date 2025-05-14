// controllers/paymentController.js
const Payment = require('../models/Payment');
const { executeTransaction, generateSuiWallet, getBalance } = require('../services/suiService');

// Get payment by id
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// Create new payment
exports.createPayment = async (req, res) => {
  try {
    const { amount, recipientAddress, senderAddress, description } = req.body;
    
    // Validate required fields
    if (!amount || !recipientAddress) {
      return res.status(400).json({ error: 'Amount and recipient address are required' });
    }
    
    const payment = new Payment({
      amount,
      recipientAddress,
      senderAddress,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Execute payment transaction
exports.executePayment = async (req, res) => {
  try {
    const { paymentId, privateKey } = req.body;
    
    if (!paymentId || !privateKey) {
      return res.status(400).json({ error: 'Payment ID and private key are required' });
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status === 'completed') {
      return res.status(400).json({ error: 'Payment has already been processed' });
    }
    
    // Execute the transaction
    const txResult = await executeTransaction({
      amount: payment.amount,
      recipientAddress: payment.recipientAddress,
      privateKey
    });
    
    // Update payment status
    payment.status = 'completed';
    payment.transactionId = txResult.transactionId;
    payment.updatedAt = new Date();
    await payment.save();
    
    res.json({
      success: true,
      transactionId: txResult.transactionId,
      payment
    });
  } catch (error) {
    console.error('Error executing payment:', error);
    res.status(500).json({ error: 'Failed to execute payment', details: error.message });
  }
};

// Get transaction status
exports.getTransactionStatus = async (req, res) => {
  try {
    const { txId } = req.params;
    
    if (!txId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    // Get transaction status from Sui service
    const txStatus = await checkTransactionStatus(txId);
    
    res.json({
      transactionId: txId,
      status: txStatus.status,
      details: txStatus.details
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({ error: 'Failed to check transaction status', details: error.message });
  }
};

// Generate a new wallet
exports.generateWallet = async (req, res) => {
  try {
    // Generate a new Sui wallet
    const wallet = await generateSuiWallet();
    
    res.json({
      address: wallet.address,
      privateKey: wallet.privateKey
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({ error: 'Failed to generate wallet', details: error.message });
  }
};

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Get balance from Sui service
    const balance = await getBalance(address);
    
    res.json({
      address,
      balance
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance', details: error.message });
  }
};