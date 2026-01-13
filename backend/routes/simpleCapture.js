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
          const metadata = session.metadata || {};
          const lawyerId = metadata.lawyerId || 48; // Default to Ahmad Umer Farooq if no metadata
          
          // Get service description from line items
          let serviceDescription = `Payment captured - $${amount}`;
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            if (lineItems.data && lineItems.data.length > 0) {
              const serviceName = lineItems.data[0].description;
              if (serviceName) {
                // Extract service type from description
                if (serviceName.includes('30-min Consultation') || serviceName.includes('Initial consultation')) {
                  serviceDescription = '30-min Consultation is paid';
                } else if (serviceName.includes('1 Hour Session') || serviceName.includes('Hourly Legal Service')) {
                  serviceDescription = '1 Hour Session is paid';
                } else if (serviceName.includes('Document Review')) {
                  serviceDescription = 'Document Review is paid';
                } else {
                  serviceDescription = `${serviceName} is paid`;
                }
              }
            }
          } catch (error) {
            // Fallback based on amount
            if (amount === 150) {
              serviceDescription = '30-min Consultation is paid';
            } else if (amount === 300) {
              serviceDescription = '1 Hour Session is paid';
            } else if (amount === 200) {
              serviceDescription = 'Document Review is paid';
            }
          }
          
          // Save transaction
          await db('transactions').insert({
            stripe_payment_id: session.payment_intent,
            user_id: user?.id || null,
            lawyer_id: lawyerId,
            amount: amount,
            platform_fee: amount * 0.05,
            lawyer_earnings: amount * 0.95,
            type: 'consultation',
            status: 'completed',
            description: serviceDescription,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          // Update lawyer earnings
          const lawyerEarnings = amount * 0.95;
          
          // Check if earnings record exists
          const existingEarnings = await db('earnings').where('lawyer_id', lawyerId).first();
          
          if (existingEarnings) {
            // Update existing record
            await db('earnings')
              .where('lawyer_id', lawyerId)
              .update({
                total_earned: parseFloat(existingEarnings.total_earned || 0) + lawyerEarnings,
                available_balance: parseFloat(existingEarnings.available_balance || 0) + lawyerEarnings,
                updated_at: new Date()
              });
          } else {
            // Create new record
            await db('earnings').insert({
              lawyer_id: lawyerId,
              total_earned: lawyerEarnings,
              available_balance: lawyerEarnings,
              pending_balance: 0,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
          
          captured++;
          console.log(`✅ Captured $${amount} payment for lawyer ID: ${lawyerId}`);
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
