require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

const fixTransactionsProperly = async () => {
  try {
    console.log('🔧 Fixing transactions properly by matching Stripe data...');
    
    // Get all transactions that need fixing
    const transactions = await db('transactions')
      .whereNotNull('stripe_payment_id')
      .orderBy('created_at', 'desc');
    
    console.log(`Found ${transactions.length} transactions to check`);
    
    for (const transaction of transactions) {
      try {
        console.log(`\nChecking transaction ${transaction.id}: $${transaction.amount}`);
        
        // Get the actual Stripe session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: transaction.stripe_payment_id,
          limit: 1
        });
        
        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          const customerEmail = session.customer_details?.email;
          
          console.log(`Stripe session email: ${customerEmail}`);
          
          if (customerEmail) {
            // Find the correct user by email
            const correctUser = await db('users').where('email', customerEmail).first();
            
            if (correctUser) {
              console.log(`Correct user: ${correctUser.name} (ID: ${correctUser.id})`);
              
              // Update transaction with correct user
              await db('transactions')
                .where('id', transaction.id)
                .update({ user_id: correctUser.id });
              
              console.log(`✅ Fixed transaction ${transaction.id} for user ${correctUser.id}`);
            } else {
              console.log(`❌ No user found for email: ${customerEmail}`);
              // Set user_id to null if no matching user
              await db('transactions')
                .where('id', transaction.id)
                .update({ user_id: null });
            }
          } else {
            console.log('❌ No customer email in Stripe session');
            await db('transactions')
              .where('id', transaction.id)
              .update({ user_id: null });
          }
        } else {
          console.log('❌ No Stripe session found for this payment_intent');
        }
        
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error.message);
      }
    }
    
    console.log('\n✅ Fix completed properly');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixTransactionsProperly();