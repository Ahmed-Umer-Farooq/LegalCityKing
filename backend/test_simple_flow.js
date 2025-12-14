const db = require('./db');
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testFlow() {
  try {
    console.log('🧪 Step 1: Creating test transaction in database...');
    
    // Insert test transaction directly into database
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: 'pi_test_' + Date.now(),
      user_id: 46, // test@example.com user ID
      lawyer_id: 1, // Existing lawyer
      amount: 300.00,
      platform_fee: 15.00,
      lawyer_earnings: 285.00,
      type: 'consultation',
      status: 'completed',
      description: 'Test payment for legal consultation',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('✅ Transaction created with ID:', transactionId);
    
    console.log('\n🧪 Step 2: Login and fetch transactions...');
    
    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Fetch transactions
    const transactionsResponse = await axios.get(`${API_BASE}/user/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Transactions fetched:', JSON.stringify(transactionsResponse.data, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await db.destroy();
  }
}

testFlow();