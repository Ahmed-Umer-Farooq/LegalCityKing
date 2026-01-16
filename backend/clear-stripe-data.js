require('dotenv').config();
const knex = require('knex')(require('./knexfile').development);

async function clearStripeData() {
  try {
    console.log('Clearing old Stripe data...');
    
    // Clear stripe_customer_id from users table
    await knex('users').update({ stripe_customer_id: null });
    console.log('✓ Cleared stripe_customer_id from users table');
    
    // Clear stripe_customer_id from lawyers table
    await knex('lawyers').update({ stripe_customer_id: null });
    console.log('✓ Cleared stripe_customer_id from lawyers table');
    
    // Clear Stripe Connect data from lawyers table
    await knex('lawyers').update({
      stripe_connect_account_id: null,
      connect_onboarding_complete: false,
      payouts_enabled: false
    });
    console.log('✓ Cleared Stripe Connect data from lawyers table');
    
    console.log('\n✅ All old Stripe data cleared successfully!');
    console.log('You can now use your new Stripe API keys.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing Stripe data:', error);
    process.exit(1);
  }
}

clearStripeData();
