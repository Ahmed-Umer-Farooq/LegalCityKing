require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function cancelSubscriptionProperly() {
  try {
    // Find the lawyer with the email from billing page
    const lawyer = await db('lawyers')
      .where('email', 'vabitar479@hudisk.com')
      .first();

    if (!lawyer || !lawyer.stripe_subscription_id) {
      console.log('No active subscription found for this lawyer');
      return;
    }

    console.log(`Cancelling subscription for: ${lawyer.name} (${lawyer.email})`);
    console.log(`Subscription ID: ${lawyer.stripe_subscription_id}`);

    // Cancel the subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(
      lawyer.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    );

    console.log('\n✅ Subscription cancelled in Stripe');
    console.log(`Status: ${updatedSubscription.status}`);
    console.log(`Cancel at period end: ${updatedSubscription.cancel_at_period_end}`);
    console.log(`Will end on: ${new Date(updatedSubscription.current_period_end * 1000)}`);

    // Update our database
    const expiryDate = new Date(updatedSubscription.current_period_end * 1000);
    
    await db('lawyers').where('id', lawyer.id).update({
      subscription_cancelled: true,
      subscription_cancelled_at: new Date(),
      auto_renew: false,
      subscription_expires_at: expiryDate
    });

    console.log('\n✅ Database updated successfully');
    console.log('The subscription will remain active until the expiry date');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

cancelSubscriptionProperly();