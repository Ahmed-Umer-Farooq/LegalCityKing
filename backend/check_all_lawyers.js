require('dotenv').config();
const db = require('./db');

async function checkAllLawyers() {
  try {
    const lawyers = await db('lawyers')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 
              'subscription_cancelled', 'subscription_expires_at', 'stripe_subscription_id')
      .whereIn('email', ['tbumer38@gmail.com', 'vabitar479@hudisk.com']);

    console.log('=== ALL LAWYERS STATUS ===\n');

    for (const lawyer of lawyers) {
      console.log(`👤 ${lawyer.name} (${lawyer.email})`);
      console.log(`   Tier: ${lawyer.subscription_tier}`);
      console.log(`   Status: ${lawyer.subscription_status}`);
      console.log(`   Cancelled: ${lawyer.subscription_cancelled ? 'YES' : 'NO'}`);
      console.log(`   Expires: ${lawyer.subscription_expires_at}`);
      console.log(`   Stripe ID: ${lawyer.stripe_subscription_id}`);
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAllLawyers();