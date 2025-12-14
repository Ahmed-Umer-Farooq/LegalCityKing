const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Capture payment after successful Stripe checkout
router.post('/capture', async (req, res) => {
  try {
    const { session_id, user_email } = req.body;
    
    console.log('💳 Capturing payment for session:', session_id);
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log('Session details:', {
      id: session.id,
      amount: session.amount_total,
      status: session.payment_status,
      customer_email: session.customer_details?.email
    });
    
    // Find user by email
    const userEmail = user_email || session.customer_details?.email;
    let user = null;
    
    if (userEmail) {
      user = await db('users').where('email', userEmail).first();
      console.log('User found:', user ? `${user.name} (ID: ${user.id})` : 'Not found');
    }
    
    // Extract metadata
    const metadata = session.metadata || {};
    const lawyerId = metadata.lawyerId;
    const amount = session.amount_total / 100;
    const platformFee = amount * 0.05;
    const lawyerEarnings = amount - platformFee;
    
    // Check if transaction already exists
    const existingTransaction = await db('transactions')
      .where('stripe_payment_id', session.payment_intent)
      .first();
    
    if (existingTransaction) {
      console.log('Transaction already exists:', existingTransaction.id);
      return res.json({ 
        success: true, 
        message: 'Transaction already captured',
        transaction_id: existingTransaction.id 
      });
    }
    
    // Save transaction to database
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: session.payment_intent,
      user_id: user?.id || null,
      lawyer_id: lawyerId,
      amount: amount,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'consultation',
      status: session.payment_status === 'paid' ? 'completed' : 'pending',
      description: `Payment to lawyer - ${session.id}`,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('✅ Transaction saved with ID:', transactionId);
    
    // Update lawyer earnings if transaction completed
    if (session.payment_status === 'paid' && lawyerId) {
      await db.raw(`
        INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        total_earned = total_earned + ?,
        available_balance = available_balance + ?,
        updated_at = NOW()
      `, [lawyerId, lawyerEarnings, lawyerEarnings, lawyerEarnings, lawyerEarnings]);
      
      console.log('✅ Lawyer earnings updated');
    }
    
    res.json({
      success: true,
      transaction_id: transactionId,
      amount: amount,
      user_id: user?.id,
      lawyer_id: lawyerId
    });
    
  } catch (error) {
    console.error('❌ Payment capture error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;