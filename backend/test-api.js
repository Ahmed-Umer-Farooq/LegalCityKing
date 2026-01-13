const request = require('supertest');
const app = require('./server');

// Test with a real JWT token from your system
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsImVtYWlsIjoidGVzdEBsYXd5ZXIuY29tIiwiaWF0IjoxNzM2NzY5NjAwfQ.test'; // Replace with real token

async function testPaymentLinksAPI() {
  try {
    console.log('Testing Payment Links API with RBAC...');
    
    // Test GET /api/payment-links (should work for lawyers)
    const response = await request(app)
      .get('/api/payment-links')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);
      
    console.log('✅ Payment links API working with RBAC');
    console.log('Response:', response.body);
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
  
  process.exit(0);
}

testPaymentLinksAPI();