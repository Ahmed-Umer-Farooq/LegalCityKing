const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testOAuthErrors() {
  try {
    console.log('🧪 Testing OAuth Error Scenarios...\n');

    // Test 1: Simulate duplicate email scenario
    console.log('1. Testing duplicate email handling...');
    
    // First, let's check what happens when we try to access OAuth callback with error
    const testUrl = `${BASE_URL}/auth/google/callback?error=This%20email%20is%20registered%20as%20a%20lawyer.%20Please%20select%20%22Lawyer%22%20and%20try%20again.`;
    
    try {
      const response = await axios.get(testUrl, { maxRedirects: 0 });
    } catch (error) {
      if (error.response?.status === 302) {
        const location = error.response.headers.location;
        console.log('✅ OAuth error redirect:', location);
        
        if (location.includes('error=')) {
          const errorParam = new URL(location).searchParams.get('error');
          console.log('✅ Error message extracted:', decodeURIComponent(errorParam));
        }
      }
    }

    console.log('\n🎉 OAuth error handling test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOAuthErrors();