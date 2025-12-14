require('dotenv').config();
const db = require('./db');

const createMissingPayment = async () => {
  try {
    console.log('🔧 Creating your missing $200 payment to Ahmad Umer Farooq...');
    
    // Ahmad Umer Farooq lawyer ID: 48
    // Your user ID: 50
    
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: `pi_manual_${Date.now()}`,
      user_id: 50,
      lawyer_id: 48, // Ahmad Umer Farooq
      amount: 200.00,
      platform_fee: 10.00,
      lawyer_earnings: 190.00,
      type: 'consultation',
      status: 'completed',
      description: 'Document consultation payment to Ahmad Umer Farooq',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log(`✅ Created transaction ID: ${transactionId}`);
    
    // Verify it was created
    const newTransaction = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.id', transactionId)
      .first();
    
    console.log(`✅ Payment created: $${newTransaction.amount} to ${newTransaction.lawyer_name}`);
    
    // Show all your transactions now
    const allUserTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.user_id', 50)
      .orderBy('transactions.created_at', 'desc');
    
    console.log(`\n✅ You now have ${allUserTransactions.length} transactions:`);
    allUserTransactions.forEach((tx, i) => {
      console.log(`${i+1}. $${tx.amount} to ${tx.lawyer_name} - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

createMissingPayment();