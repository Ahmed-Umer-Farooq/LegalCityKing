require('dotenv').config();
const db = require('./db');

const checkAhmadData = async () => {
  try {
    console.log('🔍 Checking Ahmad Umer (ID: 44) data...');
    
    // Check transactions
    const transactions = await db('transactions').where('lawyer_id', 44).orderBy('created_at', 'desc');
    console.log(`\nAhmad has ${transactions.length} transactions:`);
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description}: $${tx.amount} (earnings: $${tx.lawyer_earnings}) - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
    // Check earnings records
    const earnings = await db('earnings').where('lawyer_id', 44);
    console.log(`\nAhmad has ${earnings.length} earnings records:`);
    earnings.forEach((e, i) => {
      console.log(`${i+1}. ID: ${e.id}, Total: $${e.total_earned}, Available: $${e.available_balance}`);
    });
    
    // Calculate what earnings should be
    const totalEarnings = transactions.reduce((sum, tx) => sum + parseFloat(tx.lawyer_earnings || tx.amount * 0.95), 0);
    console.log(`\nCalculated total earnings: $${totalEarnings.toFixed(2)}`);
    
    // Check what API returns
    const apiEarnings = await db('earnings').where('lawyer_id', 44).first();
    console.log(`API returns: Total: $${apiEarnings?.total_earned || 0}, Available: $${apiEarnings?.available_balance || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkAhmadData();