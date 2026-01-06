require('dotenv').config();
const db = require('./db');

const updateTransactionDescriptions = async () => {
  try {
    console.log('🔄 Updating transaction descriptions...');
    
    // Get all transactions with generic descriptions
    const transactions = await db('transactions')
      .where('description', 'like', 'Payment captured - $%')
      .orWhere('description', 'like', 'Payment captured from Stripe session%');
    
    console.log(`Found ${transactions.length} transactions to update`);
    
    for (const transaction of transactions) {
      let newDescription = transaction.description;
      const amount = parseFloat(transaction.amount);
      
      // Map amounts to service descriptions
      if (amount === 150) {
        newDescription = '30-min Consultation is paid';
      } else if (amount === 300) {
        newDescription = '1 Hour Session is paid';
      } else if (amount === 200) {
        newDescription = 'Document Review is paid';
      } else {
        // For other amounts, keep a generic but cleaner description
        newDescription = `Legal Service ($${amount}) is paid`;
      }
      
      // Update the transaction
      await db('transactions')
        .where('id', transaction.id)
        .update({ description: newDescription });
      
      console.log(`✅ Updated transaction ${transaction.id}: ${transaction.description} → ${newDescription}`);
    }
    
    // Show updated transactions for Ahmad Umer
    const userTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.user_id', 50)
      .orderBy('transactions.created_at', 'desc');
    
    console.log(`\n✅ Ahmad Umer's updated transactions:`);
    userTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description} - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

updateTransactionDescriptions();