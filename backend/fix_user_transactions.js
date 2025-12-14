require('dotenv').config();
const db = require('./db');

const fixUserTransactions = async () => {
  console.log('🔧 Fixing User Transactions...');
  
  try {
    // Get Ahmad Umer's user record
    const user = await db('users').where('email', 'ahmadumer123123@gmail.com').first();
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);
    
    // Check recent transactions that might belong to this user
    const recentTransactions = await db('transactions')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);
    
    console.log('\n📋 Recent transactions:');
    recentTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ID: ${tx.id}, User ID: ${tx.user_id}, Amount: $${tx.amount}, Date: ${new Date(tx.created_at).toLocaleString()}`);
    });
    
    // Ask which transactions to link to Ahmad Umer
    console.log(`\n🔗 Linking recent transactions to user ${user.name} (ID: ${user.id})...`);
    
    // Update the most recent transactions to link to Ahmad Umer
    const updated = await db('transactions')
      .whereIn('id', [1, 2, 3]) // Update the 3 recent transactions
      .update({ user_id: user.id });
    
    console.log(`✅ Updated ${updated} transactions`);
    
    // Verify the update
    const userTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.user_id', user.id)
      .orderBy('transactions.created_at', 'desc');
    
    console.log(`\n✅ User now has ${userTransactions.length} transactions:`);
    userTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description || 'Payment'} - $${tx.amount} to ${tx.lawyer_name} (${tx.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

fixUserTransactions();