const db = require('./db');

async function verifyTestUser() {
  try {
    console.log('🔧 Manually verifying test user...');
    
    const result = await db('users')
      .where({ email: 'testuser@example.com' })
      .update({ 
        email_verified: 1,
        is_verified: 1,
        email_verification_code: null
      });
    
    if (result) {
      console.log('✅ Test user verified successfully');
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyTestUser();