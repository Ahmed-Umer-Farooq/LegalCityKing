require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

const captureLatestPayment = async () => {
  try {
    console.log('🔍 Looking for latest $10 payment...');
    
    // Get most recent sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 5
    });
    
    console.log(`Found ${sessions.data.length} recent sessions`);
    
    for (const session of sessions.data) {
      const amount = session.amount_total / 100;
      console.log(`Session: ${session.id}, Amount: $${amount}, Status: ${session.payment_status}`);
      
      if (session.payment_status === 'paid' && amount === 10) {
        console.log('💰 Found $10 payment!');
        
        // Check if already exists
        const existing = await db('transactions')
          .where('stripe_payment_id', session.payment_intent)
          .first();
        
        if (existing) {
          console.log('Already exists in database');
          continue;
        }
        
        // Save the $10 payment
        const [transactionId] = await db('transactions').insert({
          stripe_payment_id: session.payment_intent,
          user_id: 50, // Ahmad Umer
          lawyer_id: 48, // Ahmad Umer Farooq
          amount: 10.00,
          platform_fee: 0.50,
          lawyer_earnings: 9.50,
          type: 'consultation',
          status: 'completed',
          description: '$10 payment to Ahmad Umer Farooq',
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log(`✅ Saved $10 payment with transaction ID: ${transactionId}`);
        break;
      }
    }
    
    // Show current count
    const count = await db('transactions').where('user_id', 50).count('id as total').first();
    console.log(`Total transactions for user 50: ${count.total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

captureLatestPayment();