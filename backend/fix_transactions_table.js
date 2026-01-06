require('dotenv').config();
const db = require('./db');

async function fixTransactionsTable() {
  try {
    console.log('🔍 Checking transactions table structure...');
    
    // Check current table structure
    const columns = await db('transactions').columnInfo();
    console.log('📋 Current columns:', Object.keys(columns));
    
    // Check if stripe_payment_id allows NULL
    const stripePaymentIdColumn = columns.stripe_payment_id;
    console.log('📋 stripe_payment_id column info:', stripePaymentIdColumn);
    
    if (stripePaymentIdColumn && !stripePaymentIdColumn.nullable) {
      console.log('⚠️ stripe_payment_id column does not allow NULL, making it nullable...');
      
      await db.schema.alterTable('transactions', function(table) {
        table.string('stripe_payment_id').nullable().alter();
      });
      
      console.log('✅ Made stripe_payment_id column nullable');
    } else {
      console.log('✅ stripe_payment_id column already allows NULL');
    }
    
    // Test the problematic insert
    console.log('\n🧪 Testing transaction insert without stripe_payment_id...');
    
    try {
      const [testId] = await db('transactions').insert({
        amount: 99,
        description: 'Test payment capture - $99',
        lawyer_earnings: 94.05,
        lawyer_id: 48,
        platform_fee: 4.95,
        status: 'completed',
        stripe_payment_id: null, // This should now work
        type: 'consultation',
        user_id: null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('✅ Test insert successful, transaction ID:', testId);
      
      // Clean up test record
      await db('transactions').where('id', testId).del();
      console.log('✅ Test record cleaned up');
      
    } catch (error) {
      console.log('❌ Test insert failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error fixing transactions table:', error);
  } finally {
    process.exit(0);
  }
}

fixTransactionsTable();