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
        // Find user by email
        const userEmail = session.customer_details?.email;
        let user = null;
        
        if (userEmail) {
          user = await db('users').where('email', userEmail).first();
        }
        
        const amount = session.amount_total / 100;
        const platformFee = amount * 0.05;
        const lawyerEarnings = amount - platformFee;
        
        // Save transaction
        const [transactionId] = await db('transactions').insert({
          stripe_payment_id: session.payment_intent,
          user_id: user?.id || null,
          lawyer_id: 48, // Default to Ahmad Umer Farooq
          amount: amount,
          platform_fee: platformFee,
          lawyer_earnings: lawyerEarnings,
          type: 'consultation',
          status: 'completed',
          description: `Auto-captured payment - $${amount}`,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log('✅ Auto-captured transaction:', transactionId);
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