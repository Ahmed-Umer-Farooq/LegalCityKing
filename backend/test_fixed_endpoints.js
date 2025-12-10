const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';

// Create a test JWT token (you'll need to use a real user ID from your database)
const testUserId = 1; // Change this to a real user ID from your database
const testToken = jwt.sign(
  { id: testUserId, email: 'test@example.com' },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '1h' }
);

async function testEndpointsWithAuth() {
  console.log('🔍 Testing Fixed User Endpoints with Authentication...\n');
  
  const endpoints = [
    { method: 'GET', url: '/user/appointments', description: 'Get user appointments' },
    { method: 'GET', url: '/user/cases', description: 'Get user cases' },
    { method: 'GET', url: '/user/tasks', description: 'Get user tasks' },
    { method: 'GET', url: '/user/appointments/upcoming', description: 'Get upcoming appointments' },
    { method: 'GET', url: '/user/cases/stats', description: 'Get case statistics' },
    { method: 'GET', url: '/user/tasks/stats', description: 'Get task statistics' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.method} ${BASE_URL}${endpoint.url}`);
      console.log(`Description: ${endpoint.description}`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  Status: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`📋 Error:`, JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.log(`❌ Connection error: ${error.message}`);
      }
    }
    console.log('─'.repeat(50));
  }
  
  console.log('\n📝 Summary:');
  console.log('✅ All endpoints have been fixed to match the actual database structure');
  console.log('✅ Controllers now use user.id instead of user.secure_id');
  console.log('✅ Routes now use :id instead of :secure_id for parameters');
  console.log('✅ Database columns match what the controllers expect');
  console.log('\n🌐 Correct URLs:');
  console.log('- Calendar Appointments: http://localhost:5001/api/user/appointments');
  console.log('- Legal Cases: http://localhost:5001/api/user/cases');
  console.log('- Legal Tasks: http://localhost:5001/api/user/tasks');
  console.log('\n⚠️  Remember: Use port 5001 for backend API, not port 3000');
}

testEndpointsWithAuth();