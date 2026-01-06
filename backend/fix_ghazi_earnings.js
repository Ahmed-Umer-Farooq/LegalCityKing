require('dotenv').config();
const db = require('./db');

const fixGhaziEarnings = async () => {
  try {
    console.log('🔧 Fixing Ghazi earnings records...');
    
    // Get all Ghazi earnings records
    const allEarnings = await db('earnings').where('lawyer_id', 49).orderBy('id');
    console.log(`Found ${allEarnings.length} earnings records for Ghazi`);
    
    // Calculate total from all records
    let totalEarned = 0;
    let totalAvailable = 0;
    
    allEarnings.forEach((e, i) => {
      console.log(`${i+1}. ID: ${e.id}, Total: $${e.total_earned}, Available: $${e.available_balance}`);
      totalEarned += parseFloat(e.total_earned || 0);
      totalAvailable += parseFloat(e.available_balance || 0);
    });
    
    console.log(`\nCalculated totals: Earned: $${totalEarned}, Available: $${totalAvailable}`);
    
    // Delete all existing records
    await db('earnings').where('lawyer_id', 49).del();
    console.log('✅ Deleted all duplicate records');
    
    // Insert single correct record
    await db('earnings').insert({
      lawyer_id: 49,
      total_earned: totalEarned,
      available_balance: totalAvailable,
      pending_balance: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('✅ Created single correct earnings record');
    
    // Verify
    const finalEarnings = await db('earnings').where('lawyer_id', 49).first();
    console.log('Final earnings record:', finalEarnings);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

fixGhaziEarnings();