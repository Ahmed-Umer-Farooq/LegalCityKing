require('dotenv').config();
const db = require('./db');

async function checkSubscriptionPlans() {
  try {
    const plans = await db('subscription_plans').select('*');
    
    console.log('=== CURRENT SUBSCRIPTION PLANS ===\n');
    
    plans.forEach(plan => {
      console.log(`Name: ${plan.name}`);
      console.log(`Price: $${plan.price}`);
      console.log(`Billing: ${plan.billing_cycle}`);
      console.log(`Stripe Price ID: ${plan.stripe_price_id}`);
      console.log(`Active: ${plan.active}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSubscriptionPlans();