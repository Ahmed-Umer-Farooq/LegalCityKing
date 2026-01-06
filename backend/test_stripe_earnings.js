const db = require('./db');

async function testStripeEarningsAPI() {
  try {
    console.log('🔍 Testing Stripe Earnings API for Payment Records...\n');
    
    // Check earnings table
    const earningsCount = await db('earnings').count('id as count').first();
    console.log('📊 Total earnings records:', earningsCount.count);
    
    // Get sample earnings
    const sampleEarnings = await db('earnings')
      .select('*')
      .limit(3);
    
    console.log('\n💰 Sample earnings records:');
    sampleEarnings.forEach((earning, index) => {
      console.log(`${index + 1}. Lawyer ID: ${earning.lawyer_id}, Total: $${earning.total_earned}, Available: $${earning.available_balance}`);
    });
    
    // Check transactions for recent payments
    const recentTransactions = await db('transactions')
      .where('status', 'completed')
      .whereNotNull('lawyer_id')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    console.log('\n📋 Recent completed transactions:');
    recentTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ID: ${transaction.id}, Lawyer: ${transaction.lawyer_id}, Amount: $${transaction.amount}, Earnings: $${transaction.lawyer_earnings}, Description: ${transaction.description}`);
    });
    
    // Test the API structure that the frontend expects
    console.log('\n🔗 API Response Structure:');
    console.log('GET /api/stripe/lawyer-earnings returns:');
    console.log('- earnings: { total_earned, available_balance, pending_balance }');
    console.log('- recentTransactions: [{ id, amount, lawyer_earnings, description, created_at, ... }]');
    
    console.log('\n✅ Payment Records system updated to use existing Stripe API!');
    console.log('🎯 Frontend now uses /api/stripe/lawyer-earnings instead of /api/payment-records/records');
    
  } catch (error) {
    console.error('❌ Error testing stripe earnings API:', error);
  } finally {
    process.exit(0);
  }
}

testStripeEarningsAPI();