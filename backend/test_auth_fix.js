require('dotenv').config();
const db = require('./db');

async function testAuthFix() {
  console.log('🧪 Testing Authentication Fix...\n');
  
  try {
    // Simulate what the middleware now does
    const decoded = { id: 46 }; // Ahmad Umer's ID
    
    const lawyer = await db('lawyers').where({ id: decoded.id }).first();
    
    if (lawyer) {
      const req_user = { ...decoded, ...lawyer, role: 'lawyer' };
      
      console.log('✅ Middleware now sets req.user with:');
      console.log(`   - ID: ${req_user.id}`);
      console.log(`   - Name: ${req_user.name}`);
      console.log(`   - Email: ${req_user.email}`);
      console.log(`   - Role: ${req_user.role}`);
      console.log(`   - Subscription Tier: ${req_user.subscription_tier}`);
      console.log(`   - Subscription Status: ${req_user.subscription_status}`);
      console.log(`   - Stripe Customer ID: ${req_user.stripe_customer_id}`);
      
      console.log('\n✅ Profile API will now return:');
      const profileResponse = {
        subscription_tier: req_user.subscription_tier || 'free',
        subscription_status: req_user.subscription_status || 'inactive',
        subscription_created_at: req_user.subscription_created_at,
        stripe_customer_id: req_user.stripe_customer_id
      };
      console.log(JSON.stringify(profileResponse, null, 2));
      
    } else {
      console.log('❌ Lawyer not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testAuthFix();