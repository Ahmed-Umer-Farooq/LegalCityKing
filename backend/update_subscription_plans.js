const db = require('./db');

async function updateSubscriptionPlans() {
  try {
    console.log('🔄 Updating subscription plans...');
    
    // Clear existing plans
    await db('subscription_plans').del();
    console.log('✅ Cleared existing plans');
    
    // Insert updated plans
    await db('subscription_plans').insert([
      {
        name: 'Professional',
        stripe_price_id: 'price_1QdVJL5fbvco9iYvhJGKJGKJ',
        price: 49.00,
        billing_period: 'monthly',
        billing_cycle: 'monthly',
        features: JSON.stringify([
          'Enhanced profile management',
          'Unlimited client messaging',
          'Blog management system',
          'Advanced reports & analytics',
          'Email support'
        ]),
        active: true
      },
      {
        name: 'Premium',
        stripe_price_id: 'price_1QdVJM5fbvco9iYvhJGKJGKK',
        price: 99.00,
        billing_period: 'monthly',
        billing_cycle: 'monthly',
        features: JSON.stringify([
          'All Professional features',
          'Q&A answer management',
          'Verification badge system',
          'Forms management system',
          'Client management tools',
          'Priority phone support'
        ]),
        active: true
      },
      {
        name: 'Professional',
        stripe_price_id: 'price_1QdVJN5fbvco9iYvhJGKJGKL',
        price: 41.65,
        billing_period: 'yearly',
        billing_cycle: 'yearly',
        features: JSON.stringify([
          'Enhanced profile management',
          'Unlimited client messaging',
          'Blog management system',
          'Advanced reports & analytics',
          'Email support',
          '15% annual discount'
        ]),
        active: true
      },
      {
        name: 'Premium',
        stripe_price_id: 'price_1QdVJO5fbvco9iYvhJGKJGKM',
        price: 84.15,
        billing_period: 'yearly',
        billing_cycle: 'yearly',
        features: JSON.stringify([
          'All Professional features',
          'Q&A answer management',
          'Verification badge system',
          'Forms management system',
          'Client management tools',
          'Priority phone support',
          '15% annual discount'
        ]),
        active: true
      }
    ]);
    
    console.log('✅ Updated subscription plans successfully');
    
    // Verify the update
    const plans = await db('subscription_plans').select('*');
    console.log('📋 Current plans:', plans.map(p => `${p.name} (${p.billing_cycle}) - ${p.stripe_price_id}`));
    
  } catch (error) {
    console.error('❌ Error updating subscription plans:', error);
  } finally {
    process.exit(0);
  }
}

updateSubscriptionPlans();