const axios = require('axios');

async function testFormAPI() {
  try {
    console.log('Testing form creation API...');
    
    // Test data
    const formData = {
      title: 'Test API Form',
      description: 'Test form via API',
      category_id: 1,
      practice_area: 'General',
      price: 0,
      is_free: true
    };
    
    console.log('Sending request to create form...');
    
    // Test without authentication first
    const response = await axios.post('http://localhost:5000/api/forms/create', formData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Form created successfully:', response.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.statusText);
    console.error('Error message:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testFormAPI();