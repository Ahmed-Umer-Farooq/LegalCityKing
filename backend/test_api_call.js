require('dotenv').config();
const axios = require('axios');

const testAPI = async () => {
  try {
    // Test the user transactions API
    const response = await axios.get('http://localhost:5001/api/user/transactions', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but show us the endpoint
      }
    });
    console.log('API Response:', response.data);
  } catch (error) {
    console.log('API Error:', error.response?.status, error.response?.data);
  }
};

testAPI();