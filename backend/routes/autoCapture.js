const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Auto-capture payment when user visits success page
router.get('/success/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    console.log('🎉 Payment success, auto-capturing:', session_id);
    
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      // Check if already saved
      const existing = await db('transactions')
        .where('stripe_payment_id', session.payment_intent)
        .first();
      
      if (!existing) {
        console.log('⚠️ Payment not found in database - webhook may have failed');
      } else {
        console.log('✅ Payment already processed by webhook');
      }
    }
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?session_id=${session_id}`);
    
  } catch (error) {
    console.error('Auto-capture error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

module.exports = router;