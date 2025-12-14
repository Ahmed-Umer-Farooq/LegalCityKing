require('dotenv').config();
const db = require('./db');

const checkRecentPayment = async () => {
  try {
    // Check most recent transactions
    const recent = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    console.log('Recent transactions:');
    recent.forEach((tx, i) => {
      console.log(`${i+1}. $${tx.amount} to ${tx.lawyer_name} - User ID: ${tx.user_id} - ${new Date(tx.created_at).toLocaleString()}`);
    });
    
    // Check Ahmad Umer user
    const user = await db('users').where('email', 'ahmadumer123123@gmail.com').first();
    console.log(`\nAhmad Umer user ID: ${user?.id}`);
    
    // Check if there's a $200 payment
    const payment200 = await db('transactions')
      .select('*')
      .where('amount', 200)
      .orderBy('created_at', 'desc')
      .first();
    
    if (payment200) {
      console.log(`\nFound $200 payment: User ID ${payment200.user_id}, should be ${user?.id}`);
      
      if (payment200.user_id !== user?.id) {
        console.log('Fixing user ID...');
        await db('transactions').where('id', payment200.id).update({ user_id: user.id });
        console.log('✅ Fixed!');
      }
    } else {
      console.log('\n❌ No $200 payment found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkRecentPayment();