const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';

// Test tokens
const adminToken = jwt.sign({ id: 1, email: 'admin@test.com' }, process.env.JWT_SECRET || 'yourSecretKey');
const lawyerToken = jwt.sign({ id: 50, email: 'lawyer@test.com' }, process.env.JWT_SECRET || 'yourSecretKey');
const userToken = jwt.sign({ id: 50, email: 'user@test.com' }, process.env.JWT_SECRET || 'yourSecretKey');

async function testAPI() {
  console.log('🧪 Testing API Routes (Server must be running on port 5001)\n');

  const tests = [
    // Public routes
    { name: 'Public - Health check', method: 'GET', path: '/health', token: null, expected: 200 },
    
    // Admin routes
    { name: 'Admin - Get stats (admin)', method: 'GET', path: '/admin/stats', token: adminToken, expected: 200 },
    { name: 'Admin - Get stats (user - should fail)', method: 'GET', path: '/admin/stats', token: userToken, expected: 403 },
    
    // Lawyer routes
    { name: 'Lawyer - Get payment links', method: 'GET', path: '/payment-links', token: lawyerToken, expected: 200 },
    { name: 'User - Get payment links (should fail)', method: 'GET', path: '/payment-links', token: userToken, expected: 403 },
    
    // User routes
    { name: 'User - Get dashboard overview', method: 'GET', path: '/dashboard/overview', token: userToken, expected: 200 },
    { name: 'Lawyer - Get dashboard overview', method: 'GET', path: '/dashboard/overview', token: lawyerToken, expected: 200 },
    
    // Auth required
    { name: 'No token - Dashboard (should fail)', method: 'GET', path: '/dashboard/overview', token: null, expected: 401 }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.path}`,
        headers: test.token ? { Authorization: `Bearer ${test.token}` } : {},
        timeout: 5000
      };

      const response = await axios(config);
      
      if (response.status === test.expected) {
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expected}, Got: ${response.status}`);
        failed++;
      }
    } catch (error) {
      const status = error.response?.status || 'ERROR';
      if (status === test.expected) {
        console.log(`✅ ${test.name} - Status: ${status} (expected error)`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expected}, Got: ${status}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All API routes working correctly!');
  }
}

testAPI().catch(console.error);