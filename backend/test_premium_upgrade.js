require('dotenv').config();
const db = require('./db');

async function testPremiumUpgrade() {
  try {
    console.log('🔄 Testing premium subscription upgrade...');
    
    // Find a lawyer to test with
    const lawyer = await db('lawyers').where('email', 'btumer83@gmail.com').first();
    
    if (!lawyer) {
      console.log('❌ Test lawyer not found');
      return;
    }
    
    console.log(`📋 Found lawyer: ${lawyer.name} (ID: ${lawyer.id})`);
    console.log(`📋 Current subscription: ${lawyer.subscription_tier || 'free'}`);
    
    // Upgrade to premium
    await db('lawyers').where('id', lawyer.id).update({
      subscription_tier: 'premium',
      subscription_status: 'active',
      subscription_created_at: new Date()
    });
    
    console.log('✅ Upgraded lawyer to premium subscription');
    
    // Verify the update
    const updatedLawyer = await db('lawyers').where('id', lawyer.id).first();
    console.log(`📋 New subscription: ${updatedLawyer.subscription_tier}`);
    console.log(`📋 Subscription status: ${updatedLawyer.subscription_status}`);
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing premium upgrade:', error);
  } finally {
    process.exit(0);
  }
}

testPremiumUpgrade();