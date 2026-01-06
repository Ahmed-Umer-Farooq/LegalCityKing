const db = require('./db');

async function testTransactionUserJoin() {
  try {
    console.log('🔍 Testing Transaction-User JOIN...\n');
    
    // Test the updated query
    const transactions = await db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .select(
        'transactions.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .where('transactions.status', 'completed')
      .whereNotNull('transactions.lawyer_id')
      .orderBy('transactions.created_at', 'desc')
      .limit(5);
    
    console.log('📋 Transactions with User Info:');
    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction ID: ${transaction.id}`);
      console.log(`   User ID: ${transaction.user_id}`);
      console.log(`   User Name: ${transaction.user_name || 'NULL'}`);
      console.log(`   User Email: ${transaction.user_email || 'NULL'}`);
      console.log(`   Description: ${transaction.description}`);
      console.log(`   Amount: $${transaction.amount}`);
      console.log('   ---');
    });
    
    // Check if we have users with those IDs
    const userIds = transactions.map(t => t.user_id).filter(id => id);
    if (userIds.length > 0) {
      console.log('\n👥 Checking Users Table:');
      const users = await db('users').whereIn('id', userIds).select('id', 'name', 'email');
      users.forEach(user => {
        console.log(`   User ID ${user.id}: ${user.name} (${user.email})`);
      });
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error testing transaction-user join:', error);
  } finally {
    process.exit(0);
  }
}

testTransactionUserJoin();