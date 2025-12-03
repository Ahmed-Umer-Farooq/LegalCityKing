require('dotenv').config();
const db = require('./db');

async function debugCurrentUser() {
  console.log('🔍 Debugging Current User Issue...\n');
  
  try {
    // Check all Ahmad Umer accounts
    const ahmadAccounts = await db('lawyers')
      .where('name', 'Ahmad Umer')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 'stripe_customer_id');
    
    console.log('📋 All Ahmad Umer accounts:');
    ahmadAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ID: ${account.id}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Subscription: ${account.subscription_tier || 'free'} (${account.subscription_status || 'inactive'})`);
      console.log(`   Stripe Customer: ${account.stripe_customer_id || 'none'}`);
      console.log('');
    });
    
    // Check which one has the professional subscription
    const professionalAccount = ahmadAccounts.find(acc => acc.subscription_tier === 'professional');
    
    if (professionalAccount) {
      console.log('✅ Account with Professional subscription:');
      console.log(`   ID: ${professionalAccount.id}`);
      console.log(`   Email: ${professionalAccount.email}`);
      console.log('');
      console.log('🎯 Make sure you are logged in with this email:');
      console.log(`   ${professionalAccount.email}`);
    } else {
      console.log('❌ No account found with professional subscription');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

debugCurrentUser();