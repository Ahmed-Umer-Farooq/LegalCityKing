require('dotenv').config();
const db = require('./db');

const checkNewPayment = async () => {
  try {
    console.log('🔍 Checking if new payment was captured...');
    
    const transactions = await db('transactions').where('lawyer_id', 49).orderBy('created_at', 'desc');
    console.log(`Ghazi has ${transactions.length} transactions:`);
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description}: $${tx.amount} - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
    const earnings = await db('earnings').where('lawyer_id', 49).first();
    console.log(`\nEarnings: Total: $${earnings.total_earned}, Available: $${earnings.available_balance}`);
    
    // Check if earnings match transactions
    const totalFromTransactions = transactions.reduce((sum, tx) => sum + parseFloat(tx.lawyer_earnings || tx.amount * 0.95), 0);
    console.log(`\nCalculated from transactions: $${totalFromTransactions.toFixed(2)}`);
    console.log(`Stored in earnings: $${earnings.total_earned}`);
    
    if (parseFloat(earnings.total_earned) !== totalFromTransactions) {
      console.log('⚠️ Earnings mismatch! Need to update.');
    } else {
      console.log('✅ Earnings match transactions.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkNewPayment();