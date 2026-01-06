require('dotenv').config();
const db = require('./db');

const checkGhaziData = async () => {
  try {
    console.log('🔍 Debugging Ghazi earnings...');
    
    // Check transactions
    const transactions = await db('transactions').where('lawyer_id', 49);
    console.log(`\nGhazi has ${transactions.length} transactions:`);
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description}: $${tx.amount} (earnings: $${tx.lawyer_earnings}) - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
    // Check earnings
    const earnings = await db('earnings').where('lawyer_id', 49);
    console.log(`\nGhazi has ${earnings.length} earnings records:`);
    earnings.forEach((e, i) => {
      console.log(`${i+1}. ID: ${e.id}, Total: $${e.total_earned}, Available: $${e.available_balance}`);
    });
    
    // Test the API endpoint
    console.log('\n🔍 Testing getLawyerEarnings logic for Ghazi...');
    let ghaziEarnings = await db('earnings').where('lawyer_id', 49).first();
    if (!ghaziEarnings) {
      console.log('No earnings record found, creating one...');
      await db('earnings').insert({ lawyer_id: 49 });
      ghaziEarnings = await db('earnings').where('lawyer_id', 49).first();
    }
    
    const recentTransactions = await db('transactions')
      .where('lawyer_id', 49)
      .where('status', 'completed')
      .orderBy('created_at', 'desc')
      .limit(10);
    
    console.log('API would return:');
    console.log('Earnings:', ghaziEarnings);
    console.log('Recent transactions:', recentTransactions.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkGhaziData();