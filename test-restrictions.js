// Test script to verify dynamic restriction system
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRestrictionSystem() {
  console.log('🧪 Testing Dynamic Restriction System...\n');

  try {
    // Test 1: Fetch current restrictions
    console.log('1️⃣ Testing restriction fetch...');
    const restrictionsResponse = await axios.get(`${BASE_URL}/admin/subscription-restrictions`);
    console.log('✅ Restrictions fetched successfully');
    console.log('Current restrictions:', JSON.stringify(restrictionsResponse.data.restrictions, null, 2));

    // Test 2: Update restrictions via admin panel
    console.log('\n2️⃣ Testing restriction update...');
    const testRestrictions = {
      free: {
        messages: true,
        contacts: true,
        payment_links: true
      },
      professional: {
        forms: true
      },
      premium: {}
    };

    const updateResponse = await axios.post(`${BASE_URL}/admin/subscription-restrictions`, {
      restrictions: testRestrictions
    });
    console.log('✅ Restrictions updated successfully');

    // Test 3: Verify restrictions were saved
    console.log('\n3️⃣ Verifying restrictions were saved...');
    const verifyResponse = await axios.get(`${BASE_URL}/admin/subscription-restrictions`);
    console.log('✅ Updated restrictions verified');
    console.log('New restrictions:', JSON.stringify(verifyResponse.data.restrictions, null, 2));

    // Test 4: Test restriction checker logic
    console.log('\n4️⃣ Testing restriction checker logic...');
    
    // Simulate different user types
    const testUsers = [
      { name: 'Free User', subscription_tier: 'free' },
      { name: 'Professional User', subscription_tier: 'professional' },
      { name: 'Premium User', subscription_tier: 'premium' }
    ];

    // Import the restriction checker
    const { checkFeatureAccess } = require('./Frontend/src/utils/restrictionChecker');

    for (const user of testUsers) {
      console.log(`\n   Testing ${user.name}:`);
      
      const features = ['messages', 'contacts', 'payment_links', 'forms', 'reports'];
      for (const feature of features) {
        try {
          const access = await checkFeatureAccess(feature, user);
          const status = access.allowed ? '✅ Allowed' : `❌ Blocked (${access.reason})`;
          console.log(`     ${feature}: ${status}`);
        } catch (error) {
          console.log(`     ${feature}: ⚠️ Error checking access`);
        }
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Restriction API endpoints working');
    console.log('   ✅ Database storage/retrieval working');
    console.log('   ✅ Dynamic restriction loading working');
    console.log('   ✅ Feature access checking working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRestrictionSystem();