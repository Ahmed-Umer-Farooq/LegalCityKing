require('dotenv').config();
const db = require('./db');

const checkUnacknowledgedPayments = async () => {
  try {
    console.log('🔍 Checking unacknowledged payments for Ghazi (ID: 49)...');
    
    const recentPayments = await db('transactions')
      .where('lawyer_id', 49)
      .where('acknowledged', false)
      .orderBy('created_at', 'desc');
    
    console.log(`Ghazi has ${recentPayments.length} unacknowledged payments:`);
    recentPayments.forEach((payment, i) => {
      console.log(`${i+1}. ${payment.description}: $${payment.amount} - ${new Date(payment.created_at).toLocaleDateString()}`);
    });
    
    // Check all recent payments regardless of acknowledgment
    const allRecent = await db('transactions')
      .where('lawyer_id', 49)
      .orderBy('created_at', 'desc')
      .limit(5);
    
    console.log(`\nAll recent payments for Ghazi:`);
    allRecent.forEach((payment, i) => {
      console.log(`${i+1}. ${payment.description}: $${payment.amount} - Acknowledged: ${payment.acknowledged} - ${new Date(payment.created_at).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkUnacknowledgedPayments();