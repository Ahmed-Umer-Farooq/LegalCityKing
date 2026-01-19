require('dotenv').config();

// Quick OAuth Test
console.log('🔍 OAuth Configuration Check:');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');
console.log('Expected Redirect URI: http://localhost:5001/api/oauth/google/callback');
console.log('\n📋 Steps to fix:');
console.log('1. Go to https://console.developers.google.com/');
console.log('2. Select your project');
console.log('3. Go to Credentials → OAuth 2.0 Client IDs');
console.log('4. Add redirect URI: http://localhost:5001/api/oauth/google/callback');
console.log('5. Save and test again');