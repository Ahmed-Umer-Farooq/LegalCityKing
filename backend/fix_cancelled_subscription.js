require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function fixCancelledSubscriptions() {
  try {
    // Find the lawyer with the email from billing page
    const lawyer = await db('lawyers')
      .where('email', 'vabitar479@hudisk.com')
      .first();

    if (!lawyer) {
      console.log('Lawyer not found with email vabitar479@hudisk.com');
      return;
    }

    console.log(`Found lawyer: ${lawyer.name} (${lawyer.email})`);
    console.log(`Current status: ${lawyer.subscription_tier} - ${lawyer.subscription_status}`);
    console.log(`Stripe subscription ID: ${lawyer.stripe_subscription_id}`);

    if (lawyer.stripe_subscription_id) {
      // Get subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(lawyer.stripe_subscription_id);
      
      console.log('\n=== STRIPE SUBSCRIPTION DETAILS ===');
      console.log(`Status: ${subscription.status}`);
      console.log(`Cancel at period end: ${subscription.cancel_at_period_end}`);
      console.log(`Current period end: ${new Date(subscription.current_period_end * 1000)}`);
      
      if (subscription.canceled_at) {
        console.log(`Cancelled at: ${new Date(subscription.canceled_at * 1000)}`);
      }

      // If the subscription is set to cancel at period end, update our database
      if (subscription.cancel_at_period_end) {
        console.log('\n🔄 Updating database to reflect cancellation...');
        
        const expiryDate = new Date(subscription.current_period_end * 1000);
        
        await db('lawyers').where('id', lawyer.id).update({
          subscription_cancelled: true,
          subscription_cancelled_at: new Date(),
          auto_renew: false,
          subscription_expires_at: expiryDate
        });
        
        console.log('✅ Database updated successfully');
        console.log(`Subscription will expire on: ${expiryDate}`);
      } else {
        console.log('\n⚠️  Subscription is not set to cancel at period end in Stripe');
        console.log('This means it will continue to renew automatically');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixCancelledSubscriptions();