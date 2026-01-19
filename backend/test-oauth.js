const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testOAuthSystem() {
  console.log('🧪 Testing OAuth System...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing OAuth health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/oauth/health`);
    console.log('✅ OAuth health:', healthResponse.data);

    // Test 2: Test OAuth initiation (should redirect)
    console.log('\n2. Testing OAuth initiation...');
    try {
      await axios.get(`${BASE_URL}/api/oauth/google?role=user`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      });
      console.log('✅ OAuth initiation redirects correctly');
    } catch (error) {
      if (error.response?.status === 302) {
        console.log('✅ OAuth initiation redirects correctly');
      } else {
        console.log('❌ OAuth initiation failed:', error.message);
      }
    }

    // Test 3: Test unauthenticated /me endpoint
    console.log('\n3. Testing unauthenticated /me endpoint...');
    try {
      await axios.get(`${BASE_URL}/api/oauth/me`);
      console.log('❌ /me should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /me correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 4: Test environment variables
    console.log('\n4. Checking environment variables...');
    const envVars = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL,
      BACKEND_URL: process.env.BACKEND_URL
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (value && value !== 'your_google_client_id' && value !== 'your_google_client_secret') {
        console.log(`✅ ${key}: Set`);
      } else {
        console.log(`❌ ${key}: Missing or default value`);
      }
    });

    console.log('\n🎉 OAuth System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Start your frontend server');
    console.log('3. Visit http://localhost:3000/login');
    console.log('4. Click "Continue with Google" to test OAuth flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your backend server is running on port 5001');
      console.log('   Run: npm start in the backend directory');
    }
  }
}

// Load environment variables
require('dotenv').config();

testOAuthSystem();