const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test user credentials (you'll need to use actual credentials)
const testUser = {
  email: 'testuser@example.com',
  password: 'Test123!@#'
};

let authToken = '';

async function testProfileAPI() {
  try {
    console.log('🧪 Testing Profile API...\n');

    // 1. Login to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Get profile
    console.log('\n2. Testing get profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile fetched:', {
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      completion: profileResponse.data.profile_completion_percentage
    });

    // 3. Update profile
    console.log('\n3. Testing update profile...');
    const updateData = {
      name: 'Updated Test User',
      bio: 'This is a test bio',
      date_of_birth: '1990-01-01',
      city: 'Test City',
      state: 'Test State'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/auth/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated:', {
      name: updateResponse.data.user.name,
      completion: updateResponse.data.user.profile_completion_percentage
    });

    console.log('\n🎉 All profile API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testProfileAPI();