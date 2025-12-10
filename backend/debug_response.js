const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';
const JWT_SECRET = 'yourSecretKey';

const testToken = jwt.sign(
  { id: 1, email: 'test@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function debugResponse() {
  try {
    console.log('🔍 Testing Case Creation...');
    const response = await axios.post(`${BASE_URL}/user/cases`, {
      title: 'Debug Case',
      description: 'Testing response format',
      lawyer_name: 'Test Lawyer',
      priority: 'medium'
    }, { headers: { 'Authorization': `Bearer ${testToken}` }});
    
    console.log('Full Response:', JSON.stringify(response.data, null, 2));
    console.log('Data Keys:', Object.keys(response.data.data));
    console.log('Secure ID:', response.data.data.secure_id);
    
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

debugResponse();