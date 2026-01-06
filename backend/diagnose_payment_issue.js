const db = require('./db');

async function diagnoseProblem() {
  try {
    console.log('🔍 Diagnosing Payment Data Inconsistency...\n');
    
    // Get current user ID (assuming you're the logged in lawyer)
    const lawyers = await db('lawyers').select('id', 'name').limit(5);
    console.log('👨‍⚖️ Available lawyers:');
    lawyers.forEach(lawyer => {
      console.log(`   ID: ${lawyer.id}, Name: ${lawyer.name}`);
    });
    
    // Check earnings table
    console.log('\n💰 Earnings Table:');
    const earnings = await db('earnings').select('*');
    earnings.forEach(earning => {
      console.log(`   Lawyer ${earning.lawyer_id}: Total=$${earning.total_earned}, Available=$${earning.available_balance}`);
    });
    
    // Check transactions for each lawyer
    console.log('\n📊 Transaction Analysis:');
    for (const lawyer of lawyers) {
      const transactions = await db('transactions')
        .where('lawyer_id', lawyer.id)
        .where('status', 'completed');
      
      const totalReceived = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.lawyer_earnings || 0), 0);
      const totalFees = transactions.reduce((sum, t) => sum + parseFloat(t.platform_fee || 0), 0);
      
      console.log(`\n   Lawyer ${lawyer.id} (${lawyer.name}):`);
      console.log(`     Transactions: ${transactions.length}`);
      console.log(`     Total Received: $${totalReceived.toFixed(2)}`);
      console.log(`     Total Earnings: $${totalEarnings.toFixed(2)}`);
      console.log(`     Total Fees: $${totalFees.toFixed(2)}`);
      console.log(`     Math Check: $${totalReceived.toFixed(2)} - $${totalFees.toFixed(2)} = $${(totalReceived - totalFees).toFixed(2)}`);
      
      if (Math.abs(totalEarnings - (totalReceived - totalFees)) > 0.01) {
        console.log(`     ❌ INCONSISTENCY DETECTED!`);
      } else {
        console.log(`     ✅ Data is consistent`);
      }
    }
    
    console.log('\n🔍 The issue is likely:');
    console.log('1. Different data sources (earnings table vs transactions calculation)');
    console.log('2. Duplicate earnings records');
    console.log('3. Missing transactions in the filtered view');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseProblem();