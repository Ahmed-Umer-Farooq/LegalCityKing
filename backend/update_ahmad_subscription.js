require('dotenv').config();
const db = require('./db');

async function updateAhmadSubscription() {
  try {
    console.log('🔄 Updating Ahmad Umer subscription status...\n');
    
    // Update Ahmad Umer with professional subscription
    const result = await db('lawyers')
      .where('name', 'Ahmad Umer')
      .where('email', 'ahmadumer123123@gmail.com')
      .update({
        subscription_tier: 'professional',
        subscription_status: 'active',
        stripe_subscription_id: 'sub_test_professional_123',
        stripe_customer_id: 'cus_test_ahmad_123'
      });
    
    console.log(`✅ Updated ${result} lawyer record(s)`);
    
    // Verify the update
    const updatedLawyer = await db('lawyers')
      .where('name', 'Ahmad Umer')
      .where('email', 'ahmadumer123123@gmail.com')
      .select('name', 'email', 'subscription_tier', 'subscription_status', 'stripe_subscription_id')
      .first();
    
    console.log('\n📋 Updated lawyer details:');
    console.log(`- Name: ${updatedLawyer.name}`);
    console.log(`- Email: ${updatedLawyer.email}`);
    console.log(`- Subscription Tier: ${updatedLawyer.subscription_tier}`);
    console.log(`- Subscription Status: ${updatedLawyer.subscription_status}`);
    console.log(`- Stripe Subscription ID: ${updatedLawyer.stripe_subscription_id}`);
    
    console.log('\n✅ Ahmad Umer now has active professional subscription!');
    
  } catch (error) {
    console.error('❌ Error updating subscription:', error.message);
  } finally {
    process.exit(0);
  }
}

updateAhmadSubscription();