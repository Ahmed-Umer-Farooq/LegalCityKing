require('dotenv').config();
const db = require('./db');

const fixAhmadEarnings = async () => {
  try {
    console.log('🔧 Fixing Ahmad Umer (ID: 44) earnings records...');
    
    // Get all transactions to calculate correct total
    const transactions = await db('transactions').where('lawyer_id', 44);
    const totalEarnings = transactions.reduce((sum, tx) => sum + parseFloat(tx.lawyer_earnings || tx.amount * 0.95), 0);
    
    console.log(`Ahmad has ${transactions.length} transactions totaling $${totalEarnings.toFixed(2)} in earnings`);
    
    // Delete all existing earnings records
    const deletedCount = await db('earnings').where('lawyer_id', 44).del();
    console.log(`✅ Deleted ${deletedCount} duplicate earnings records`);
    
    // Insert single correct record
    await db('earnings').insert({
      lawyer_id: 44,
      total_earned: totalEarnings,
      available_balance: totalEarnings,
      pending_balance: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('✅ Created single correct earnings record');
    
    // Verify
    const finalEarnings = await db('earnings').where('lawyer_id', 44).first();
    console.log(`Final earnings: Total: $${finalEarnings.total_earned}, Available: $${finalEarnings.available_balance}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

fixAhmadEarnings();