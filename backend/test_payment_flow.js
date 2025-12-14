const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Test 1: Make payment to lawyer
async function testPaymentToLawyer() {
  try {
    console.log('🧪 Test 1: Making payment to lawyer...');
    
    // First login to get token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Make payment to lawyer
    const paymentResponse = await axios.post(`${API_BASE}/user/payments/pay-lawyer`, {
      lawyer_id: 1, // Lawyer ID from database
      amount: 250,
      description: 'Legal consultation for divorce case'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Payment created:', paymentResponse.data);
    return { token, paymentData: paymentResponse.data };
  } catch (error) {
    console.error('❌ Test 1 failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Fetch updated transactions
async function testFetchTransactions(token) {
  try {
    console.log('\n🧪 Test 2: Fetching updated transactions...');
    
    const response = await axios.get(`${API_BASE}/user/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Transactions fetched:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Test 2 failed:', error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting payment flow tests...\n');
  
  const test1Result = await testPaymentToLawyer();
  if (!test1Result) return;
  
  // Wait a moment for database to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const test2Result = await testFetchTransactions(test1Result.token);
  
  console.log('\n✅ All tests completed!');
}

runTests();