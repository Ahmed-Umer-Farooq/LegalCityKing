require('dotenv').config();
const db = require('./db');

async function transferSubscription() {
  try {
    console.log('🔄 Transferring subscription to correct lawyer account...\n');
    
    // Update tbumer38@gmail.com (ID: 44) with professional subscription
    await db('lawyers')
      .where('id', 44)
      .where('email', 'tbumer38@gmail.com')
      .update({
        subscription_tier: 'professional',
        subscription_status: 'active',
        subscription_created_at: new Date('2024-12-01'),
        stripe_customer_id: 'cus_TX2iRACHOtCwax',
        stripe_subscription_id: 'sub_test_professional_123'
      });
    
    // Reset the other account to free
    await db('lawyers')
      .where('id', 46)
      .where('email', 'ahmadumer123123@gmail.com')
      .update({
        subscription_tier: 'free',
        subscription_status: 'inactive',
        subscription_created_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null
      });
    
    console.log('✅ Subscription transferred successfully!');
    
    // Verify the changes
    const lawyerAccount = await db('lawyers')
      .where('email', 'tbumer38@gmail.com')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 'stripe_customer_id')
      .first();
    
    const userAccount = await db('lawyers')
      .where('email', 'ahmadumer123123@gmail.com')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 'stripe_customer_id')
      .first();
    
    console.log('\n📋 Updated accounts:');
    console.log(`Lawyer Account (${lawyerAccount.email}):`);
    console.log(`  - Subscription: ${lawyerAccount.subscription_tier} (${lawyerAccount.subscription_status})`);
    console.log(`  - Stripe Customer: ${lawyerAccount.stripe_customer_id}`);
    
    console.log(`\nUser Account (${userAccount.email}):`);
    console.log(`  - Subscription: ${userAccount.subscription_tier || 'free'} (${userAccount.subscription_status || 'inactive'})`);
    console.log(`  - Stripe Customer: ${userAccount.stripe_customer_id || 'none'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

transferSubscription();