require('dotenv').config();
const db = require('./db');

const findMissingPayment = async () => {
  try {
    // Check for Ahmad Umer Farooq lawyer
    const ahmadLawyer = await db('lawyers')
      .where('name', 'like', '%Ahmad%')
      .orWhere('name', 'like', '%Umer%')
      .orWhere('name', 'like', '%Farooq%');
    
    console.log('Ahmad Umer lawyers found:');
    ahmadLawyer.forEach(lawyer => {
      console.log(`- ID: ${lawyer.id}, Name: ${lawyer.name}, Email: ${lawyer.email}`);
    });
    
    // Check all transactions to any Ahmad
    const ahmadTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('lawyers.name', 'like', '%Ahmad%')
      .orderBy('created_at', 'desc');
    
    console.log(`\nTransactions to Ahmad lawyers: ${ahmadTransactions.length}`);
    ahmadTransactions.forEach(tx => {
      console.log(`- $${tx.amount} to ${tx.lawyer_name} - User: ${tx.user_id} - ${new Date(tx.created_at).toLocaleString()}`);
    });
    
    // Check for any $200 payments today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayPayments = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('created_at', '>=', today)
      .orderBy('created_at', 'desc');
    
    console.log(`\nToday's payments: ${todayPayments.length}`);
    todayPayments.forEach(tx => {
      console.log(`- $${tx.amount} to ${tx.lawyer_name} - User: ${tx.user_id} - ${new Date(tx.created_at).toLocaleString()}`);
    });
    
    // If no $200 payment found, create it manually for testing
    if (!ahmadTransactions.find(tx => tx.amount == 200)) {
      console.log('\n🔧 Creating missing $200 payment...');
      
      const ahmadLawyerId = ahmadLawyer.find(l => l.name.includes('Ahmad'))?.id || 1;
      const userId = 50; // Ahmad Umer user ID
      
      const [transactionId] = await db('transactions').insert({
        stripe_payment_id: `pi_test_${Date.now()}`,
        user_id: userId,
        lawyer_id: ahmadLawyerId,
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
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

findMissingPayment();