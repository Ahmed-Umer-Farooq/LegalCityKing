require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

const fixGhaziPayment = async () => {
  try {
    console.log('🔍 Looking for recent $300 payment that should go to Ghazi...');
    
    // Get recent sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({ limit: 10 });
    
    for (const session of sessions.data) {
      if (session.payment_status === 'paid' && session.amount_total === 30000) { // $300
        console.log(`\n💳 Checking session: ${session.id}`);
        console.log(`Amount: $${session.amount_total / 100}`);
        console.log(`Metadata:`, session.metadata);
        
        // Check if this payment should go to Ghazi (lawyer ID 49)
        if (session.metadata?.lawyerId === '49') {
          console.log('✅ Found payment that should go to Ghazi!');
          
          // Find the transaction in our database
          const transaction = await db('transactions')
            .where('stripe_payment_id', session.payment_intent)
            .first();
          
          if (transaction) {
            console.log(`Found transaction ID: ${transaction.id}, currently assigned to lawyer: ${transaction.lawyer_id}`);
            
            if (transaction.lawyer_id !== 49) {
              console.log('🔄 Fixing transaction assignment...');
              
              // Update transaction to correct lawyer
              await db('transactions')
                .where('id', transaction.id)
                .update({ lawyer_id: 49 });
              
              // Remove from wrong lawyer's earnings
              const oldLawyerEarnings = transaction.lawyer_earnings;
              await db.raw(`
                UPDATE earnings 
                SET total_earned = total_earned - ?, 
                    available_balance = available_balance - ?,
                    updated_at = NOW()
                WHERE lawyer_id = ?
              `, [oldLawyerEarnings, oldLawyerEarnings, transaction.lawyer_id]);
              
              // Add to Ghazi's earnings
              await db.raw(`
                INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                total_earned = total_earned + ?,
                available_balance = available_balance + ?,
                updated_at = NOW()
              `, [49, oldLawyerEarnings, oldLawyerEarnings, oldLawyerEarnings, oldLawyerEarnings]);
              
              console.log('✅ Transaction fixed! Payment now assigned to Ghazi.');
            } else {
              console.log('✅ Transaction already assigned to Ghazi.');
            }
          } else {
            console.log('❌ Transaction not found in database.');
          }
        }
      }
    }
    
    // Show final results
    console.log('\n📊 Final earnings summary:');
    const allEarnings = await db('earnings')
      .select('earnings.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'earnings.lawyer_id', 'lawyers.id')
      .where('earnings.total_earned', '>', 0);
    
    allEarnings.forEach(earning => {
      console.log(`${earning.lawyer_name} (ID: ${earning.lawyer_id}): Total: $${Number(earning.total_earned).toFixed(2)}, Available: $${Number(earning.available_balance).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

fixGhaziPayment();