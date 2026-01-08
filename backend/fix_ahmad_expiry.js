require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function fixAhmadExpiryDate() {
  try {
    const lawyer = await db('lawyers')
      .where('email', 'tbumer38@gmail.com')
      .first();

    console.log(`Fixing expiry for: ${lawyer.name}`);
    console.log(`Current Stripe ID: ${lawyer.stripe_subscription_id}`);

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(lawyer.stripe_subscription_id);
    
    console.log(`Subscription status: ${subscription.status}`);
    console.log(`Cancel at period end: ${subscription.cancel_at_period_end}`);
    
    // Set expiry to 1 month from cancellation date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    await db('lawyers').where('id', lawyer.id).update({
      subscription_expires_at: expiryDate
    });

    console.log(`✅ Updated expiry date to: ${expiryDate}`);
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    console.log(`Days remaining: ${daysRemaining}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAhmadExpiryDate();