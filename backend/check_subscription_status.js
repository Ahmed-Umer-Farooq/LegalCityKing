require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function checkSubscriptionStatus() {
  try {
    // Get all lawyers with active subscriptions
    const lawyers = await db('lawyers')
      .whereNotNull('stripe_subscription_id')
      .select('id', 'name', 'email', 'stripe_subscription_id', 'subscription_tier', 
              'subscription_status', 'subscription_cancelled', 'subscription_expires_at');

    console.log('=== SUBSCRIPTION STATUS CHECK ===\n');

    for (const lawyer of lawyers) {
      console.log(`Lawyer: ${lawyer.name} (${lawyer.email})`);
      console.log(`Database Status: ${lawyer.subscription_tier} - ${lawyer.subscription_status}`);
      console.log(`Cancelled: ${lawyer.subscription_cancelled}`);
      console.log(`Expires: ${lawyer.subscription_expires_at}`);

      if (lawyer.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(lawyer.stripe_subscription_id);
          console.log(`Stripe Status: ${subscription.status}`);
          console.log(`Cancel at period end: ${subscription.cancel_at_period_end}`);
          console.log(`Current period end: ${new Date(subscription.current_period_end * 1000)}`);
          
          if (subscription.canceled_at) {
            console.log(`Cancelled at: ${new Date(subscription.canceled_at * 1000)}`);
          }
        } catch (error) {
          console.log(`Error fetching Stripe subscription: ${error.message}`);
        }
      }
      console.log('---\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSubscriptionStatus();