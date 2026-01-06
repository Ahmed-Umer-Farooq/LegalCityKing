require('dotenv').config();
const db = require('./db');

async function testProfessionalUpgrade() {
  try {
    console.log('🔄 Testing professional subscription upgrade...');
    
    // Find another lawyer to test with (or create a test one)
    let lawyer = await db('lawyers').where('email', 'test@lawyer.com').first();
    
    if (!lawyer) {
      // Create a test lawyer
      const [lawyerId] = await db('lawyers').insert({
        name: 'Test Professional Lawyer',
        email: 'test@lawyer.com',
        password: 'hashedpassword',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      lawyer = await db('lawyers').where('id', lawyerId).first();
      console.log('📋 Created test lawyer');
    }
    
    console.log(`📋 Found lawyer: ${lawyer.name} (ID: ${lawyer.id})`);
    console.log(`📋 Current subscription: ${lawyer.subscription_tier || 'free'}`);
    
    // Upgrade to professional
    await db('lawyers').where('id', lawyer.id).update({
      subscription_tier: 'professional',
      subscription_status: 'active',
      subscription_created_at: new Date()
    });
    
    console.log('✅ Upgraded lawyer to professional subscription');
    
    // Verify the update
    const updatedLawyer = await db('lawyers').where('id', lawyer.id).first();
    console.log(`📋 New subscription: ${updatedLawyer.subscription_tier}`);
    console.log(`📋 Subscription status: ${updatedLawyer.subscription_status}`);
    
    console.log('🎉 Professional test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing professional upgrade:', error);
  } finally {
    process.exit(0);
  }
}

testProfessionalUpgrade();