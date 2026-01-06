require('dotenv').config();
const db = require('./db');

const checkTransactions = async () => {
  try {
    console.log('🔍 Checking recent transactions...');
    
    const transactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name', 'users.name as user_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .orderBy('transactions.created_at', 'desc')
      .limit(5);
    
    console.log('\nRecent transactions:');
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description} - $${tx.amount} to ${tx.lawyer_name} (ID: ${tx.lawyer_id}) - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
    console.log('\n🔍 Checking all lawyers earnings...');
    const allEarnings = await db('earnings')
      .select('earnings.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'earnings.lawyer_id', 'lawyers.id');
    
    allEarnings.forEach(earning => {
      console.log(`${earning.lawyer_name} (ID: ${earning.lawyer_id}): Total: $${earning.total_earned || 0}, Available: $${earning.available_balance || 0}`);
    });
    
    console.log('\n🔍 Checking Ghazi specifically...');
    const ghaziTransactions = await db('transactions').where('lawyer_id', 49).orderBy('created_at', 'desc');
    console.log(`Ghazi has ${ghaziTransactions.length} transactions:`);
    ghaziTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description} - $${tx.amount} - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkTransactions();