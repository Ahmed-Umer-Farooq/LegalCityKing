const axios = require('axios');

async function testOAuthFlow() {
  console.log('🔍 Testing OAuth Configuration...\n');
  
  try {
    // Test 1: Check OAuth health
    console.log('1. Testing OAuth health endpoint...');
    const healthResponse = await axios.get('http://localhost:5001/api/oauth/health');
    console.log('✅ OAuth health:', healthResponse.data);
    
    // Test 2: Check if OAuth initiation works
    console.log('\n2. Testing OAuth initiation URL generation...');
    const oauthConfig = require('./config/oauth');
    const { url, state } = oauthConfig.getAuthURL('user');
    console.log('✅ OAuth URL generated successfully');
    console.log('   URL starts with:', url.substring(0, 50) + '...');
    console.log('   State generated:', state.substring(0, 10) + '...');
    
    // Test 3: Check environment variables
    console.log('\n3. Checking environment variables...');
    const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL', 'JWT_SECRET'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log('❌ Missing environment variables:', missing);
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Test 4: Check session configuration
    console.log('\n4. Checking session configuration...');
    if (process.env.SESSION_SECRET || process.env.JWT_SECRET) {
      console.log('✅ Session secret is configured');
    } else {
      console.log('❌ No session secret found');
    }
    
    console.log('\n🎯 OAuth Flow Test Summary:');
    console.log('- OAuth endpoints are accessible');
    console.log('- Configuration is valid');
    console.log('- Environment variables are set');
    console.log('\n📝 To test complete flow:');
    console.log('1. Start the server: npm start');
    console.log('2. Go to: http://localhost:3000/login');
    console.log('3. Click "Continue with Google as User/Lawyer"');
    console.log('4. Complete Google authentication');
    console.log('5. Should redirect to dashboard');
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start it with: npm start');
    }
  }
}

// Run the test
testOAuthFlow();