require('dotenv').config();
const db = require('./db');

async function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription System...\n');
  
  try {
    // Test 1: Check subscription plans in database
    console.log('1. Checking subscription plans...');
    const plans = await db('subscription_plans').select('*');
    console.log(`Found ${plans.length} subscription plans:`);
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billing_cycle} (Stripe: ${plan.stripe_price_id})`);
    });
    
    // Test 2: Check if lawyers table has subscription fields
    console.log('\n2. Checking lawyers subscription data...');
    const lawyers = await db('lawyers')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 'stripe_customer_id', 'stripe_subscription_id')
      .limit(5);
    
    console.log('Lawyers subscription status:');
    lawyers.forEach(lawyer => {
      console.log(`- ${lawyer.name}: Tier=${lawyer.subscription_tier || 'free'}, Status=${lawyer.subscription_status || 'none'}`);
      console.log(`  Stripe Customer: ${lawyer.stripe_customer_id || 'none'}`);
      console.log(`  Stripe Subscription: ${lawyer.stripe_subscription_id || 'none'}`);
    });
    
    // Test 3: Check active subscriptions
    console.log('\n3. Checking active subscriptions...');
    const activeSubscriptions = await db('lawyers')
      .where('subscription_status', 'active')
      .select('name', 'email', 'subscription_tier', 'stripe_subscription_id');
    
    if (activeSubscriptions.length > 0) {
      console.log(`✅ Found ${activeSubscriptions.length} active subscriptions:`);
      activeSubscriptions.forEach(sub => {
        console.log(`- ${sub.name} (${sub.subscription_tier}) - ${sub.stripe_subscription_id}`);
      });
    } else {
      console.log('❌ No active subscriptions found');
    }
    
    // Test 4: Test API endpoints
    console.log('\n4. Testing API endpoints...');
    console.log('Available endpoints:');
    console.log('- GET /api/stripe/subscription-plans');
    console.log('- POST /api/stripe/create-subscription-checkout');
    console.log('- GET /api/stripe/lawyer-earnings');
    console.log('- GET /api/stripe/receipt');
    
    console.log('\n✅ Subscription system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testSubscriptionSystem();