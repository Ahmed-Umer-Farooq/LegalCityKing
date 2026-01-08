require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function getSubscriptionReport() {
  try {
    const lawyer = await db('lawyers')
      .where('email', 'vabitar479@hudisk.com')
      .first();

    if (!lawyer) {
      console.log('❌ Lawyer not found');
      return;
    }

    console.log('=== SUBSCRIPTION CANCELLATION REPORT ===\n');
    console.log(`👤 Name: ${lawyer.name}`);
    console.log(`📧 Email: ${lawyer.email}`);
    console.log(`💼 Current Tier: ${lawyer.subscription_tier}`);
    console.log(`📊 Status: ${lawyer.subscription_status}`);
    console.log(`❌ Cancelled: ${lawyer.subscription_cancelled ? 'YES' : 'NO'}`);
    
    if (lawyer.subscription_cancelled_at) {
      console.log(`📅 Cancelled On: ${new Date(lawyer.subscription_cancelled_at).toLocaleString()}`);
    }
    
    if (lawyer.subscription_expires_at) {
      console.log(`⏰ Expires On: ${new Date(lawyer.subscription_expires_at).toLocaleString()}`);
    }
    
    console.log(`🔄 Auto Renew: ${lawyer.auto_renew ? 'YES' : 'NO'}`);

    if (lawyer.stripe_subscription_id) {
      console.log('\n=== STRIPE DETAILS ===');
      try {
        const subscription = await stripe.subscriptions.retrieve(lawyer.stripe_subscription_id);
        console.log(`🏷️  Subscription ID: ${subscription.id}`);
        console.log(`📈 Stripe Status: ${subscription.status}`);
        console.log(`🛑 Will Cancel at Period End: ${subscription.cancel_at_period_end ? 'YES' : 'NO'}`);
        
        if (subscription.current_period_end) {
          console.log(`📅 Current Period Ends: ${new Date(subscription.current_period_end * 1000).toLocaleString()}`);
        }
        
        if (subscription.canceled_at) {
          console.log(`❌ Stripe Cancelled At: ${new Date(subscription.canceled_at * 1000).toLocaleString()}`);
        }
      } catch (error) {
        console.log(`❌ Error fetching Stripe data: ${error.message}`);
      }
    }

    console.log('\n=== SUMMARY ===');
    if (lawyer.subscription_cancelled) {
      console.log('✅ Your subscription is CANCELLED');
      console.log('✅ You will keep access until expiry date');
      console.log('✅ No future charges will occur');
    } else {
      console.log('⚠️  Subscription is still ACTIVE and will renew');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

getSubscriptionReport();