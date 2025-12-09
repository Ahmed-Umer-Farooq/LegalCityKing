const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testFormsAPI() {
  console.log('🧪 Testing Legal Forms API\n');

  try {
    // Test 1: Get Categories
    console.log('1️⃣ Testing GET /api/forms/categories');
    const categoriesRes = await axios.get(`${BASE_URL}/forms/categories`);
    console.log('✅ Categories:', categoriesRes.data.length, 'found');
    console.log('   Sample:', categoriesRes.data[0]?.name);

    // Test 2: Get Public Forms
    console.log('\n2️⃣ Testing GET /api/forms/public');
    const formsRes = await axios.get(`${BASE_URL}/forms/public`);
    console.log('✅ Public Forms:', formsRes.data.forms.length, 'found');
    console.log('   Pagination:', formsRes.data.pagination);

    // Test 3: Get Forms by Category
    console.log('\n3️⃣ Testing GET /api/forms/public?category=1');
    const categoryFormsRes = await axios.get(`${BASE_URL}/forms/public?category=1`);
    console.log('✅ Category Forms:', categoryFormsRes.data.forms.length, 'found');

    console.log('\n✅ All public API tests passed!');
    console.log('\n📝 Note: Lawyer and Admin endpoints require authentication');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFormsAPI();
