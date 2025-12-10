const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test endpoints
const endpoints = [
  '/user/appointments',
  '/user/cases', 
  '/user/tasks'
];

async function testEndpoints() {
  console.log('🔍 Testing User Endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${BASE_URL}${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer dummy-token' // This will fail auth but show if route exists
        }
      });
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log(`✅ ${endpoint} - Route exists (401 Unauthorized - expected without valid token)`);
        } else if (error.response.status === 404) {
          console.log(`❌ ${endpoint} - Route not found (404)`);
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${error.response.status} - ${error.response.statusText}`);
        }
      } else {
        console.log(`❌ ${endpoint} - Connection error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('\n📝 Correct URLs to use:');
  console.log('- Calendar Appointments: http://localhost:5001/api/user/appointments');
  console.log('- Legal Cases: http://localhost:5001/api/user/cases');
  console.log('- Legal Tasks: http://localhost:5001/api/user/tasks');
  console.log('\n⚠️  Note: You were trying to access port 3000 (frontend) instead of 5001 (backend)');
}

testEndpoints();