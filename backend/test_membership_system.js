const db = require('./db');
const { checkExpiredMemberships } = require('./controllers/stripeController');

async function testMembershipSystem() {
  console.log('🧪 Testing Membership Cancellation and Expiry System...\n');

  try {
    // 1. Check current lawyers with subscriptions
    console.log('1. Current lawyers with active subscriptions:');
    const activeLawyers = await db('lawyers')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_status', 
              'subscription_expires_at', 'subscription_cancelled', 'auto_renew')
      .whereNot('subscription_tier', 'free');
    
    console.log(`Found ${activeLawyers.length} lawyers with active subscriptions:`);
    activeLawyers.forEach(lawyer => {
      console.log(`- ${lawyer.name} (${lawyer.email}): ${lawyer.subscription_tier} tier, expires: ${lawyer.subscription_expires_at}, cancelled: ${lawyer.subscription_cancelled}`);
    });

    // 2. Test expiry check function
    console.log('\n2. Testing expiry check function:');
    const expiryResult = await checkExpiredMemberships();
    console.log(`Expired memberships found: ${expiryResult.expired_count}`);

    // 3. Show subscription status for first lawyer (if any)
    if (activeLawyers.length > 0) {
      const testLawyer = activeLawyers[0];
      console.log(`\n3. Subscription details for ${testLawyer.name}:`);
      
      const now = new Date();
      const expiryDate = testLawyer.subscription_expires_at ? new Date(testLawyer.subscription_expires_at) : null;
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;
      
      console.log(`- Tier: ${testLawyer.subscription_tier}`);
      console.log(`- Status: ${testLawyer.subscription_status}`);
      console.log(`- Expires: ${testLawyer.subscription_expires_at}`);
      console.log(`- Days until expiry: ${daysUntilExpiry}`);
      console.log(`- Cancelled: ${testLawyer.subscription_cancelled}`);
      console.log(`- Auto-renew: ${testLawyer.auto_renew}`);
    }

    console.log('\n✅ Membership system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testMembershipSystem();