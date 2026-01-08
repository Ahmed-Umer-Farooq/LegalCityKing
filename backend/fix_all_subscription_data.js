require('dotenv').config();
const db = require('./db');

async function fixAllSubscriptionData() {
  try {
    // Get all lawyers with premium/professional tiers but missing cancellation data
    const lawyers = await db('lawyers')
      .whereIn('subscription_tier', ['premium', 'professional'])
      .where(function() {
        this.whereNull('subscription_cancelled')
          .orWhereNull('subscription_expires_at');
      });

    console.log(`Found ${lawyers.length} lawyers needing subscription data fixes`);

    for (const lawyer of lawyers) {
      console.log(`\n🔧 Fixing: ${lawyer.name} (${lawyer.email})`);
      console.log(`   Current tier: ${lawyer.subscription_tier}`);
      console.log(`   Cancelled: ${lawyer.subscription_cancelled}`);
      console.log(`   Expires: ${lawyer.subscription_expires_at}`);

      // Set default expiry date (1 month from now) if missing
      let expiryDate = lawyer.subscription_expires_at;
      if (!expiryDate) {
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        console.log(`   Setting expiry to: ${expiryDate}`);
      }

      // Update the lawyer with proper cancellation data
      await db('lawyers').where('id', lawyer.id).update({
        subscription_cancelled: 1, // Mark as cancelled
        subscription_cancelled_at: new Date(), // Set cancellation time
        subscription_expires_at: expiryDate, // Set expiry date
        auto_renew: 0 // Disable auto-renew
      });

      console.log('   ✅ Updated with cancellation data');
    }

    console.log('\n🎉 All subscription data fixed!');

    // Show final status
    const updatedLawyers = await db('lawyers')
      .whereIn('subscription_tier', ['premium', 'professional'])
      .select('name', 'email', 'subscription_tier', 'subscription_cancelled', 'subscription_expires_at');

    console.log('\n=== FINAL STATUS ===');
    updatedLawyers.forEach(lawyer => {
      const daysRemaining = lawyer.subscription_expires_at 
        ? Math.ceil((new Date(lawyer.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;
      
      console.log(`${lawyer.name}: ${lawyer.subscription_tier} - Cancelled: ${lawyer.subscription_cancelled ? 'YES' : 'NO'} - Days left: ${daysRemaining}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAllSubscriptionData();