require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function fixExpiryDate() {
  try {
    const lawyer = await db('lawyers')
      .where('email', 'vabitar479@hudisk.com')
      .first();

    if (!lawyer || !lawyer.stripe_subscription_id) {
      console.log('No subscription found');
      return;
    }

    console.log(`Fixing expiry date for: ${lawyer.name}`);
    
    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(lawyer.stripe_subscription_id);
    
    console.log('Stripe subscription details:');
    console.log(`Status: ${subscription.status}`);
    console.log(`Cancel at period end: ${subscription.cancel_at_period_end}`);
    console.log(`Current period end: ${new Date(subscription.current_period_end * 1000)}`);
    
    // Update database with correct expiry date
    const expiryDate = new Date(subscription.current_period_end * 1000);
    
    await db('lawyers').where('id', lawyer.id).update({
      subscription_expires_at: expiryDate,
      subscription_status: 'active' // Keep active until expiry
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

fixExpiryDate();