require('dotenv').config();
const axios = require('axios');

const testSimple = async () => {
  try {
    // Test health endpoint first
    console.log('Testing health endpoint...');
    const health = await axios.get('http://localhost:5001/health');
    console.log('✅ Server is running:', health.data);
    
    // Test referral endpoint directly
    console.log('\nTesting referral endpoint...');
    const response = await axios.get('http://localhost:5001/api/referral/data', {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Referral endpoint exists (401 Unauthorized - expected)');
    } else if (error.response?.status === 404) {
      console.log('❌ Referral endpoint not found - server needs restart');
    } else {
      console.log('Error:', error.response?.status, error.response?.data);
    }
  }
};

testSimple();