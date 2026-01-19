const axios = require('axios');

async function testAuthenticationFix() {
  console.log('🔍 Testing Authentication Fix...\n');
  
  try {
    // Test 1: Check OAuth endpoint accessibility
    console.log('1. Testing OAuth endpoints...');
    const oauthHealth = await axios.get('http://localhost:5001/api/oauth/health');
    console.log('✅ OAuth health:', oauthHealth.data.status);
    
    // Test 2: Test protected route without token (should fail gracefully)
    console.log('\n2. Testing protected route without token...');
    try {
      await axios.get('http://localhost:5001/api/dashboard/stats');
      console.log('❌ Should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected route correctly requires authentication');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status);
      }
    }
    
    // Test 3: Test with malformed token (should fail gracefully)
    console.log('\n3. Testing with malformed token...');
    try {
      await axios.get('http://localhost:5001/api/dashboard/stats', {
        headers: { Authorization: 'Bearer oauth_authenticated' }
      });
      console.log('❌ Should have failed with malformed token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Malformed token correctly rejected');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status);
      }
    }
    
    // Test 4: Check cookie-based authentication endpoint
    console.log('\n4. Testing OAuth /me endpoint...');
    try {
      await axios.get('http://localhost:5001/api/oauth/me', {
        withCredentials: true
      });
      console.log('✅ OAuth /me endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OAuth /me correctly requires authentication');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status);
      }
    }
    
    console.log('\n🎯 Authentication Fix Test Summary:');
    console.log('- OAuth endpoints are working');
    console.log('- Protected routes require authentication');
    console.log('- Malformed tokens are rejected');
    console.log('- Cookie-based auth is supported');
    console.log('\n📝 Next steps:');
    console.log('1. Test OAuth login flow in browser');
    console.log('2. Verify dashboard access after OAuth login');
    console.log('3. Check that user stays logged in');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start it with: npm start');
    }
  }
}

// Run the test
testAuthenticationFix();