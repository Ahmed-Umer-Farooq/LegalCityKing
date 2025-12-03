const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function createTestUser() {
  try {
    console.log('🧪 Creating test user...\n');

    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      username: 'testuser123',
      password: 'Test123!@#',
      mobile_number: '+1234567890'
    };

    const response = await axios.post(`${BASE_URL}/auth/register-user`, userData);
    console.log('✅ Test user created:', response.data);

    // Verify email automatically for testing
    if (response.data.verificationCode) {
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-email`, {
        email: userData.email,
        code: response.data.verificationCode
      });
      console.log('✅ Email verified:', verifyResponse.data);
    }

  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Test user already exists');
    } else {
      console.error('❌ Failed to create test user:', error.response?.data || error.message);
    }
  }
}

createTestUser();