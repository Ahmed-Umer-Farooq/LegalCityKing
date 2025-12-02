require('dotenv').config();
const db = require('./db');

async function fixSubscriptionPlans() {
  try {
    console.log('🔄 Fixing subscription plans billing cycle...\n');
    
    // Update billing cycles
    await db('subscription_plans')
      .where('name', 'Professional')
      .where('price', 49.00)
      .update({ billing_cycle: 'monthly' });
    
    await db('subscription_plans')
      .where('name', 'Premium')
      .where('price', 99.00)
      .update({ billing_cycle: 'monthly' });
    
    await db('subscription_plans')
      .where('name', 'Professional')
      .where('price', 499.00)
      .update({ billing_cycle: 'yearly' });
    
    await db('subscription_plans')
      .where('name', 'Premium')
      .where('price', 999.00)
      .update({ billing_cycle: 'yearly' });
    
    console.log('✅ Updated billing cycles');
    
    // Show updated plans
    const plans = await db('subscription_plans').select('*');
    console.log('\n📋 Updated subscription plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billing_cycle} (${plan.stripe_price_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixSubscriptionPlans();