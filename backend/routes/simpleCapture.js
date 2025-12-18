const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Simple endpoint to capture any recent payments
router.post('/capture-now', async (req, res) => {
  try {
    console.log('🔍 Capturing recent payments...');
    
    // Get last 3 sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({ limit: 3 });
    
    let captured = 0;
    
    for (const session of sessions.data) {
      if (session.payment_status === 'paid') {
        // Check if already exists
        const existing = await db('transactions')
          .where('stripe_payment_id', session.payment_intent)
          .first();
        
        if (!existing) {
          // Find user by email
          const userEmail = session.customer_details?.email;
          let user = null;
          
          if (userEmail) {
            user = await db('users').where('email', userEmail).first();
            console.log(`Found user: ${user ? user.name + ' (ID: ' + user.id + ')' : 'Not found'} for email: ${userEmail}`);
          }
          
          const amount = session.amount_total / 100;
          
          // Save transaction
          await db('transactions').insert({
            stripe_payment_id: session.payment_intent,
            user_id: user?.id || null,
            lawyer_id: 48, // Ahmad Umer Farooq
            amount: amount,
            platform_fee: amount * 0.05,
            lawyer_earnings: amount * 0.95,
            type: 'consultation',
            status: 'completed',
            description: `Payment captured - $${amount}`,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          captured++;
          console.log(`✅ Captured $${amount} payment`);
        }
      }
    }
    
    res.json({ 
      success: true, 
      captured: captured,
      message: `Captured ${captured} new payments`
    });
    
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;