require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function findAndCancelAhmadSubscription() {
  try {
    // Find Ahmad Umer in database
    const lawyer = await db('lawyers')
      .where('email', 'tbumer38@gmail.com')
      .first();

    if (!lawyer) {
      console.log('Ahmad Umer not found');
      return;
    }

    console.log(`Found: ${lawyer.name} (${lawyer.email})`);
    console.log(`Current Stripe ID: ${lawyer.stripe_subscription_id}`);

    // Search for subscriptions by customer email
    const customers = await stripe.customers.list({
      email: 'tbumer38@gmail.com',
      limit: 10
    });

    console.log(`Found ${customers.data.length} customers with this email`);

    for (const customer of customers.data) {
      console.log(`\nCustomer: ${customer.id} (${customer.email})`);
      
      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10
      });

      console.log(`Found ${subscriptions.data.length} subscriptions`);

      for (const subscription of subscriptions.data) {
        console.log(`  Subscription: ${subscription.id}`);
        console.log(`  Status: ${subscription.status}`);
        console.log(`  Cancel at period end: ${subscription.cancel_at_period_end}`);
        
        if (subscription.current_period_end) {
          console.log(`  Period end: ${new Date(subscription.current_period_end * 1000)}`);
        }

        // If subscription is active and not set to cancel, cancel it
        if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
          console.log(`  🔄 Cancelling subscription ${subscription.id}...`);
          
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true
          });
          
          console.log(`  ✅ Cancelled successfully`);
          
          // Update database with correct subscription ID and cancellation
          const expiryDate = new Date(subscription.current_period_end * 1000);
          
          await db('lawyers').where('id', lawyer.id).update({
            stripe_subscription_id: subscription.id,
            subscription_cancelled: true,
            subscription_cancelled_at: new Date(),
            auto_renew: false,
            subscription_expires_at: expiryDate
          });
          
          console.log(`  ✅ Database updated with expiry: ${expiryDate}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

findAndCancelAhmadSubscription();