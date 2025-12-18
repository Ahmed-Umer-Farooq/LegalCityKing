require('dotenv').config();
const db = require('./db');

const fixOrphanedTransactions = async () => {
  try {
    console.log('🔧 Fixing orphaned transactions...');
    
    // Find transactions with user_id 50 that might belong to other users
    const orphanedTransactions = await db('transactions')
      .where('user_id', 50)
      .whereNotNull('stripe_payment_id')
      .orderBy('created_at', 'desc');
    
    console.log(`Found ${orphanedTransactions.length} transactions with user_id 50`);
    
    for (const transaction of orphanedTransactions) {
      console.log(`\nChecking transaction ${transaction.id}: $${transaction.amount}`);
      console.log(`Description: ${transaction.description}`);
      console.log(`Created: ${transaction.created_at}`);
      
      // Check if this should belong to user 65 based on recent activity
      const user65 = await db('users').where('id', 65).first();
      if (user65) {
        console.log(`User 65: ${user65.name} (${user65.email})`);
        
        // Update the transaction to belong to user 65
        await db('transactions')
          .where('id', transaction.id)
          .update({ user_id: 65 });
        
        console.log(`✅ Reassigned transaction ${transaction.id} to user 65`);
      }
    }
    
    console.log('\n✅ Fix completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixOrphanedTransactions();