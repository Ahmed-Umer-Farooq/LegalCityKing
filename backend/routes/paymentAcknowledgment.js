const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const db = require('../db');

// Acknowledge payment
router.post('/acknowledge/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const lawyerId = req.user.id;
    
    // Verify transaction belongs to this lawyer
    const transaction = await db('transactions')
      .where('id', transactionId)
      .where('lawyer_id', lawyerId)
      .first();
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.acknowledged) {
      return res.status(400).json({ error: 'Payment already acknowledged' });
    }
    
    // Update transaction as acknowledged
    await db('transactions')
      .where('id', transactionId)
      .update({
        acknowledged: true,
        acknowledged_at: new Date()
      });
    
    res.json({ 
      success: true, 
      message: 'Payment acknowledged successfully',
      acknowledged_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Payment acknowledgment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unacknowledged payments for lawyer
router.get('/unacknowledged', authenticateToken, async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const unacknowledged = await db('transactions')
      .select('transactions.*', 'users.name as user_name', 'users.email as user_email')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where('transactions.lawyer_id', lawyerId)
      .where('transactions.acknowledged', false)
      .where('transactions.status', 'completed')
      .orderBy('transactions.created_at', 'desc');
    
    res.json(unacknowledged);
    
  } catch (error) {
    console.error('Get unacknowledged payments error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;