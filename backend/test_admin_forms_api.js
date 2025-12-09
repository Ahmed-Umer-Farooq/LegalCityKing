const axios = require('axios');

async function testAdminFormsAPI() {
  console.log('🧪 Testing Admin Forms API\n');

  // You need to get admin token first
  console.log('⚠️  You need admin token to test these endpoints');
  console.log('1. Login as admin in browser');
  console.log('2. Open DevTools > Application > Local Storage');
  console.log('3. Copy the "token" value');
  console.log('4. Replace TOKEN_HERE below\n');

  const ADMIN_TOKEN = 'TOKEN_HERE'; // Replace with actual admin token

  if (ADMIN_TOKEN === 'TOKEN_HERE') {
    console.log('❌ Please set ADMIN_TOKEN first!');
    return;
  }

  try {
    // Test 1: Get all forms
    console.log('1️⃣ Testing GET /api/forms/admin/all');
    const allForms = await axios.get('http://localhost:5001/api/forms/admin/all', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ All forms:', allForms.data.forms.length);

    // Test 2: Get pending forms
    console.log('\n2️⃣ Testing GET /api/forms/admin/all?status=pending');
    const pendingForms = await axios.get('http://localhost:5001/api/forms/admin/all?status=pending', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ Pending forms:', pendingForms.data.forms.length);
    if (pendingForms.data.forms.length > 0) {
      console.log('   First pending form:', pendingForms.data.forms[0].title);
    }

    // Test 3: Get stats
    console.log('\n3️⃣ Testing GET /api/forms/admin/stats');
    const stats = await axios.get('http://localhost:5001/api/forms/admin/stats', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ Stats:', stats.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAdminFormsAPI();
