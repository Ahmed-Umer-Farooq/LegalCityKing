require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function fixAllLawyersStripeIds() {
  try {
    // Get all lawyers with subscriptions
    const lawyers = await db('lawyers')
      .whereNotNull('stripe_subscription_id')
      .whereNot('subscription_tier', 'free');

    console.log(`Found ${lawyers.length} lawyers with subscriptions`);

    for (const lawyer of lawyers) {
      console.log(`\n🔍 Checking: ${lawyer.name} (${lawyer.email})`);
      console.log(`Current Stripe ID: ${lawyer.stripe_subscription_id}`);

      // Skip if already has a valid Stripe ID format
      if (lawyer.stripe_subscription_id.startsWith('sub_1')) {
        console.log('✅ Already has valid Stripe ID');
        continue;
      }

      try {
        // Find customer by email
        const customers = await stripe.customers.list({
          email: lawyer.email,
          limit: 1
        });

        if (customers.data.length === 0) {
          console.log('❌ No Stripe customer found');
          continue;
        }

        const customer = customers.data[0];
        console.log(`Found customer: ${customer.id}`);

        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 10
        });

        if (subscriptions.data.length === 0) {
          console.log('❌ No active subscriptions found');
          continue;
        }

        // Use the first active subscription
        const subscription = subscriptions.data[0];
        console.log(`Found subscription: ${subscription.id}`);

        // Update database with correct Stripe ID
        await db('lawyers').where('id', lawyer.id).update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id
        });

        console.log('✅ Updated with correct Stripe IDs');

      } catch (error) {
        console.log(`❌ Error for ${lawyer.email}: ${error.message}`);
      }
    }

    console.log('\n🎉 Finished updating all lawyers');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAllLawyersStripeIds();