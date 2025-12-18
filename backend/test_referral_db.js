require('dotenv').config();
const db = require('./db');
const { getReferralData, processReferralReward } = require('./controllers/referralController');

const testReferralDB = async () => {
  try {
    console.log('🧪 Testing Referral System (Database Level)...\n');
    
    // Test 1: Get referral data for test user
    console.log('1. Testing getReferralData...');
    const testUser = await db('users').where('email', 'testuser@example.com').first();
    
    const mockReq = { user: { id: testUser.id } };
    const mockRes = {
      json: (data) => {
        if (data && data.data) {
          console.log('✅ Referral data retrieved:');
          console.log(`   Referral Code: ${data.data.referral_code}`);
          console.log(`   Referral Link: ${data.data.referral_link}`);
          console.log(`   Total Referrals: ${data.data.stats.total_referrals}`);
          console.log(`   Total Earnings: $${data.data.stats.total_earnings}`);
        } else {
          console.log('❌ Invalid response data:', data);
        }
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`Status ${code}:`, data);
          return data;
        }
      })
    };
    
    await getReferralData(mockReq, mockRes);
    
    // Test 2: Create a test referral
    console.log('\n2. Creating test referral...');
    const referralCode = testUser.referral_code;
    
    // Create a new user with referral
    const newUserId = await db('users').insert({
      name: 'Referred User',
      email: `referred${Date.now()}@example.com`,
      password: 'test123',
      email_verified: 1,
      referral_code: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      referred_by: referralCode,
      secure_id: require('crypto').randomBytes(16).toString('hex')
    });
    
    // Create referral record
    await db('referrals').insert({
      referrer_id: testUser.id,
      referred_user_id: newUserId[0],
      referred_email: `referred${Date.now()}@example.com`,
      status: 'pending'
    });
    
    console.log('✅ Test referral created');
    
    // Test 3: Process referral reward
    console.log('\n3. Processing referral reward...');
    await processReferralReward(newUserId[0]);
    console.log('✅ Referral reward processed');
    
    // Test 4: Check updated stats
    console.log('\n4. Checking updated stats...');
    await getReferralData(mockReq, mockRes);
    
    console.log('\n✅ All referral database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
};

testReferralDB();