require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

const testReferralAPI = async () => {
  try {
    console.log('🧪 Testing Referral API...\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get referral data
    console.log('\n2. Getting referral data...');
    const referralResponse = await axios.get(`${BASE_URL}/referral/data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const referralData = referralResponse.data.data;
    console.log('✅ Referral data retrieved:');
    console.log(`   Referral Code: ${referralData.referral_code}`);
    console.log(`   Referral Link: ${referralData.referral_link}`);
    console.log(`   Total Referrals: ${referralData.stats.total_referrals}`);
    console.log(`   Completed Referrals: ${referralData.stats.completed_referrals}`);
    console.log(`   Total Earnings: $${referralData.stats.total_earnings}`);
    
    // Step 3: Test registration with referral code
    console.log('\n3. Testing registration with referral code...');
    const testEmail = `test${Date.now()}@example.com`;
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Referral User',
        email: testEmail,
        password: 'password123',
        ref: referralData.referral_code
      });
      console.log('✅ Registration with referral successful');
    } catch (error) {
      if (error.response?.status === 201 || error.response?.data?.message?.includes('Registration successful')) {
        console.log('✅ Registration with referral successful');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      }
    }
    
    // Step 4: Check updated referral stats
    console.log('\n4. Checking updated referral stats...');
    const updatedResponse = await axios.get(`${BASE_URL}/referral/data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedData = updatedResponse.data.data;
    console.log('✅ Updated referral data:');
    console.log(`   Total Referrals: ${updatedData.stats.total_referrals}`);
    console.log(`   Pending Referrals: ${updatedData.stats.pending_referrals}`);
    
    if (updatedData.referrals.length > 0) {
      console.log('\n📋 Recent Referrals:');
      updatedData.referrals.forEach((ref, i) => {
        console.log(`   ${i+1}. ${ref.referee_name || ref.referee_email} - $${ref.reward_amount} (${ref.status})`);
      });
    }
    
    console.log('\n✅ All referral API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testReferralAPI();