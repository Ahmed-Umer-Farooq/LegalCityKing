require('dotenv').config();
const db = require('./db');

async function fixSubscriptionDate() {
  try {
    console.log('🔄 Setting proper subscription creation date...\n');
    
    // Set subscription creation date to match your Stripe dashboard subscription
    const subscriptionDate = new Date('2024-12-01'); // Adjust this to match your actual subscription date
    
    await db('lawyers')
      .where('name', 'Ahmad Umer')
      .where('email', 'ahmadumer123123@gmail.com')
      .update({
        subscription_created_at: subscriptionDate
      });
    
    console.log('✅ Updated subscription creation date');
    
    // Verify the update
    const updated = await db('lawyers')
      .where('name', 'Ahmad Umer')
      .where('email', 'ahmadumer123123@gmail.com')
      .select('name', 'subscription_tier', 'subscription_status', 'subscription_created_at')
      .first();
    
    console.log('\n📋 Updated subscription info:');
    console.log(`- Name: ${updated.name}`);
    console.log(`- Tier: ${updated.subscription_tier}`);
    console.log(`- Status: ${updated.subscription_status}`);
    console.log(`- Created: ${new Date(updated.subscription_created_at).toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixSubscriptionDate();