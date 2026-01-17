require('dotenv').config();

console.log('🔍 Checking AI Configuration...\n');

console.log('Environment Variables:');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV);

if (!process.env.GEMINI_API_KEY) {
  console.log('\n❌ GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

console.log('\n📋 Next Steps to Enable Gemini API:');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Select your project: gen-lang-client-0711113923');
console.log('3. Enable the Generative Language API');
console.log('4. Make sure your API key has proper permissions');
console.log('5. Try the test again');

console.log('\n✅ Configuration check complete!');