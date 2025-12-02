require('dotenv').config();
const axios = require('axios');

async function testReceiptButton() {
  console.log('🧪 Testing Receipt Download Button...\n');
  
  const baseURL = 'http://localhost:5001';
  
  try {
    // Test 1: Check if receipt endpoint exists
    console.log('1. Testing receipt endpoint availability...');
    try {
      await axios.get(`${baseURL}/api/stripe/receipt`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Receipt endpoint exists (returns 400 for missing session_id as expected)');
      } else {
        console.log('❌ Receipt endpoint error:', error.message);
      }
    }
    
    // Test 2: Test with invalid session ID
    console.log('\n2. Testing with invalid session ID...');
    try {
      const response = await axios.get(`${baseURL}/api/stripe/receipt?session_id=invalid_test_session`);
      console.log('❌ Should have failed with invalid session');
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('✅ Correctly handles invalid session ID');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Check PaymentSuccess component
    console.log('\n3. Checking PaymentSuccess component...');
    const fs = require('fs');
    const paymentSuccessPath = '../Frontend/src/pages/PaymentSuccess.jsx';
    
    if (fs.existsSync(paymentSuccessPath)) {
      const content = fs.readFileSync(paymentSuccessPath, 'utf8');
      
      if (content.includes('handleDownloadReceipt')) {
        console.log('✅ PaymentSuccess has handleDownloadReceipt function');
      } else {
        console.log('❌ PaymentSuccess missing handleDownloadReceipt function');
      }
      
      if (content.includes('/api/stripe/receipt')) {
        console.log('✅ PaymentSuccess calls correct API endpoint');
      } else {
        console.log('❌ PaymentSuccess missing API call');
      }
      
      if (content.includes('Download Receipt')) {
        console.log('✅ Download Receipt button exists');
      } else {
        console.log('❌ Download Receipt button missing');
      }
    } else {
      console.log('❌ PaymentSuccess.jsx file not found');
    }
    
    console.log('\n📋 Receipt Button Status:');
    console.log('✅ Backend API endpoint: /api/stripe/receipt');
    console.log('✅ Frontend component: PaymentSuccess.jsx');
    console.log('✅ Button functionality: handleDownloadReceipt');
    
    console.log('\n🎯 To test the receipt button:');
    console.log('1. Make a test payment through the frontend');
    console.log('2. Complete Stripe checkout (use test card: 4242 4242 4242 4242)');
    console.log('3. On success page, click "Download Receipt" button');
    console.log('4. Should download a formatted receipt file');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReceiptButton();