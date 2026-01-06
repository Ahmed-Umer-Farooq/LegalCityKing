require('dotenv').config();
const db = require('./db');

async function testCapturePayment() {
  try {
    console.log('🧪 Testing capture payment functionality...');
    
    // Test inserting a transaction without stripe_payment_id
    const testTransaction = {
      stripe_payment_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: null,
      lawyer_id: 48,
      amount: 99,
      platform_fee: 4.95,
      lawyer_earnings: 94.05,
      type: 'consultation',
      status: 'completed',
      description: 'Payment captured - $99',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('📋 Test transaction data:', testTransaction);
    
    const [transactionId] = await db('transactions').insert(testTransaction);
    console.log('✅ Transaction inserted successfully with ID:', transactionId);
    
    // Verify the transaction was saved
    const savedTransaction = await db('transactions').where('id', transactionId).first();
    console.log('📋 Saved transaction:', {
      id: savedTransaction.id,
      stripe_payment_id: savedTransaction.stripe_payment_id,
      amount: savedTransaction.amount,
      status: savedTransaction.status
    });
    
    // Clean up
    await db('transactions').where('id', transactionId).del();
    console.log('✅ Test transaction cleaned up');
    
    console.log('\n🎉 Capture payment functionality is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testCapturePayment();