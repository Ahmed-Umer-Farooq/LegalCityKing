const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testEndpoints() {
  console.log('🧪 Testing User Cases and Tasks Endpoints...\n');

  // Test cases endpoint
  try {
    console.log('Testing /api/user/cases...');
    const casesResponse = await axios.get(`${BASE_URL}/api/user/cases`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail auth but show if route exists
      }
    });
    console.log('✅ Cases endpoint exists');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Cases endpoint exists (auth required)');
    } else if (error.response?.status === 404) {
      console.log('❌ Cases endpoint not found');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5001');
    } else {
      console.log('⚠️ Cases endpoint error:', error.message);
    }
  }

  // Test tasks endpoint
  try {
    console.log('Testing /api/user/tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/user/tasks`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Tasks endpoint exists');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Tasks endpoint exists (auth required)');
    } else if (error.response?.status === 404) {
      console.log('❌ Tasks endpoint not found');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5001');
    } else {
      console.log('⚠️ Tasks endpoint error:', error.message);
    }
  }

  // Test server health
  try {
    console.log('Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data.message);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5001');
    } else {
      console.log('⚠️ Health check error:', error.message);
    }
  }
}

testEndpoints();