const jwt = require('jsonwebtoken');
const axios = require('axios');

// Create a test JWT token for lawyer ID 50
const testToken = jwt.sign(
  { id: 50, email: 'lotano8521@dubokutv.com' },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '1h' }
);

console.log('Test token created for lawyer ID 50');

// Test the profile endpoint
async function testProfileEndpoint() {
  try {
    console.log('Testing profile endpoint...');
    const response = await axios.get('http://localhost:5001/api/profile', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      },
      timeout: 5000
    });
    
    console.log('Profile endpoint response:', response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running on port 5001');
    } else if (error.response) {
      console.error('Profile endpoint error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Profile endpoint error:', error.message);
    }
  }
}

testProfileEndpoint();