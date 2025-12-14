const express = require('express');
const router = express.Router();
const db = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Test API 1: Create payment to lawyer
router.post('/create-payment', async (req, res) => {
  try {
    const { userId, lawyerId, amount, description } = req.body;

    // Validate inputs
    if (!lawyerId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lawyer ID and amount are required' 
      });
    }

    // Get lawyer details
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lawyer not found' 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        user_id: userId || '',
        lawyer_id: lawyerId,
        description: description || 'Legal consultation'
      }
    });

    // Calculate fees
    const platformFee = amount * 0.05;
    const lawyerEarnings = amount - platformFee;

    // Save transaction
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: paymentIntent.id,
      user_id: userId || null,
      lawyer_id: lawyerId,
      amount: amount,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'consultation',
      status: 'completed',
      description: description || 'Legal consultation payment'
    });

    // Update lawyer earnings
    await db.raw(`
      INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      total_earned = total_earned + ?,
      available_balance = available_balance + ?,
      updated_at = NOW()
    `, [lawyerId, lawyerEarnings, lawyerEarnings, lawyerEarnings, lawyerEarnings]);

    res.json({
      success: true,
      data: {
        transactionId,
        paymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        lawyerEarnings,
        lawyer: lawyer.name
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test API 2: Fetch payment data
router.get('/payment/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await db('transactions')
      .select('transactions.*', 'users.name as user_name', 'lawyers.name as lawyer_name')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.id', transactionId)
      .first();

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }

    // Get lawyer earnings
    const earnings = await db('earnings').where('lawyer_id', transaction.lawyer_id).first();

    res.json({
      success: true,
      data: {
        transaction,
        earnings
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test API 3: Fetch accounting data
router.get('/accounting/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // Get all transactions
    const transactions = await db('transactions')
      .select('transactions.*', 'users.name as user_name')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where('transactions.lawyer_id', lawyerId)
      .orderBy('transactions.created_at', 'desc');

    // Get earnings summary
    const earnings = await db('earnings').where('lawyer_id', lawyerId).first();

    // Monthly earnings
    const monthlyEarnings = await db('transactions')
      .where('lawyer_id', lawyerId)
      .where('status', 'completed')
      .whereRaw('MONTH(created_at) = MONTH(CURRENT_DATE())')
      .whereRaw('YEAR(created_at) = YEAR(CURRENT_DATE())')
      .sum('lawyer_earnings as total');

    // Payment statistics
    const stats = {
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.status === 'completed').length,
      totalEarned: earnings?.total_earned || 0,
      availableBalance: earnings?.available_balance || 0,
      monthlyEarnings: monthlyEarnings[0].total || 0
    };

    res.json({
      success: true,
      data: {
        transactions,
        earnings,
        stats
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test API 4: Get all lawyers for testing
router.get('/lawyers', async (req, res) => {
  try {
    const lawyers = await db('lawyers')
      .select('id', 'name', 'email', 'consultation_rate')
      .limit(10);

    res.json({
      success: true,
      data: lawyers
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;