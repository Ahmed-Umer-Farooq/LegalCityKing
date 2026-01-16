require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testAPIs() {
  try {
    // Generate a test token for lawyer ID 44
    const token = jwt.sign(
      { id: 44, email: 'tbumer38@gmail.com', role: 'lawyer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('=== Testing APIs with Token ===\n');
    console.log('Token generated for lawyer ID: 44\n');

    // Test 1: /stripe/lawyer-earnings
    console.log('1. Testing /stripe/lawyer-earnings...');
    try {
      const earningsRes = await axios.get('http://localhost:5001/api/stripe/lawyer-earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Status:', earningsRes.status);
      console.log('   Response:', JSON.stringify(earningsRes.data, null, 2));
    } catch (err) {
      console.log('   ❌ Error:', err.response?.status, err.response?.data || err.message);
    }

    console.log('');

    // Test 2: /lawyer/dashboard/stats
    console.log('2. Testing /lawyer/dashboard/stats...');
    try {
      const statsRes = await axios.get('http://localhost:5001/api/lawyer/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Status:', statsRes.status);
      console.log('   Response:', JSON.stringify(statsRes.data, null, 2));
    } catch (err) {
      console.log('   ❌ Error:', err.response?.status, err.response?.data || err.message);
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIs();
