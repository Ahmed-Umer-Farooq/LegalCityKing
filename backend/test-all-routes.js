const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./server');

// Test tokens for different user types
const adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin' }, process.env.JWT_SECRET);
const lawyerToken = jwt.sign({ id: 50, email: 'lawyer@test.com', role: 'lawyer' }, process.env.JWT_SECRET);
const userToken = jwt.sign({ id: 50, email: 'user@test.com', role: 'user' }, process.env.JWT_SECRET);

async function testRoutes() {
  console.log('🧪 Testing All Routes with Modern RBAC\n');

  const tests = [
    // Public routes (no auth required)
    {
      name: 'Public - Get subscription plans',
      method: 'GET',
      path: '/api/stripe/subscription-plans',
      token: null,
      expectedStatus: 200
    },
    {
      name: 'Public - Get blogs',
      method: 'GET', 
      path: '/api/blogs',
      token: null,
      expectedStatus: 200
    },

    // Admin routes
    {
      name: 'Admin - Get stats (with admin token)',
      method: 'GET',
      path: '/api/admin/stats',
      token: adminToken,
      expectedStatus: 200
    },
    {
      name: 'Admin - Get stats (with user token - should fail)',
      method: 'GET',
      path: '/api/admin/stats',
      token: userToken,
      expectedStatus: 403
    },
    {
      name: 'Admin - Get users',
      method: 'GET',
      path: '/api/admin/users',
      token: adminToken,
      expectedStatus: 200
    },

    // Lawyer routes
    {
      name: 'Lawyer - Get payment links (with lawyer token)',
      method: 'GET',
      path: '/api/payment-links',
      token: lawyerToken,
      expectedStatus: 200
    },
    {
      name: 'Lawyer - Get payment links (with user token - should fail)',
      method: 'GET',
      path: '/api/payment-links',
      token: userToken,
      expectedStatus: 403
    },
    {
      name: 'Lawyer - Get dashboard stats',
      method: 'GET',
      path: '/api/lawyer/dashboard/stats',
      token: lawyerToken,
      expectedStatus: 200
    },
    {
      name: 'Lawyer - Get cases',
      method: 'GET',
      path: '/api/cases',
      token: lawyerToken,
      expectedStatus: 200
    },

    // User routes
    {
      name: 'User - Get dashboard overview',
      method: 'GET',
      path: '/api/dashboard/overview',
      token: userToken,
      expectedStatus: 200
    },
    {
      name: 'User - Get own cases',
      method: 'GET',
      path: '/api/user/cases',
      token: userToken,
      expectedStatus: 200
    },
    {
      name: 'User - Get own tasks',
      method: 'GET',
      path: '/api/user/tasks',
      token: userToken,
      expectedStatus: 200
    },

    // Cross-access tests (should fail)
    {
      name: 'User accessing lawyer dashboard (should fail)',
      method: 'GET',
      path: '/api/lawyer/dashboard/stats',
      token: userToken,
      expectedStatus: 403
    },
    {
      name: 'Lawyer accessing user cases (should fail)',
      method: 'GET',
      path: '/api/user/cases',
      token: lawyerToken,
      expectedStatus: 403
    },

    // Authentication required tests
    {
      name: 'Protected route without token (should fail)',
      method: 'GET',
      path: '/api/dashboard/overview',
      token: null,
      expectedStatus: 401
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      let req = request(app)[test.method.toLowerCase()](test.path);
      
      if (test.token) {
        req = req.set('Authorization', `Bearer ${test.token}`);
      }

      const response = await req;
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${tests.length}`);

  if (failed === 0) {
    console.log('\n🎉 All routes are working correctly with modern RBAC!');
  } else {
    console.log('\n⚠️  Some routes need attention.');
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Add timeout and error handling
setTimeout(() => {
  console.log('❌ Test timeout - server may not be responding');
  process.exit(1);
}, 30000);

testRoutes().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});