// Test script to check authentication and API endpoints
// Run this in browser console on http://localhost:3000

console.log('🔍 Testing Frontend Authentication & API...\n');

// Check if user is logged in
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('1. Authentication Status:');
console.log('   Token exists:', !!token);
console.log('   User data exists:', !!user);

if (token) {
  console.log('   Token preview:', token.substring(0, 20) + '...');
}

if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('   User type:', userData.type || 'unknown');
    console.log('   User email:', userData.email || 'unknown');
  } catch (e) {
    console.log('   User data invalid JSON');
  }
}

// Test API endpoints
async function testEndpoints() {
  console.log('\n2. Testing API Endpoints:');
  
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:5001/health', auth: false },
    { name: 'User Cases', url: 'http://localhost:5001/api/user/cases', auth: true },
    { name: 'User Tasks', url: 'http://localhost:5001/api/user/tasks', auth: true }
  ];

  for (const endpoint of endpoints) {
    try {
      const headers = {};
      if (endpoint.auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint.url, { headers });
      console.log(`   ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (endpoint.name === 'User Cases') {
          console.log(`     Cases found: ${data.data?.length || 0}`);
        }
        if (endpoint.name === 'User Tasks') {
          console.log(`     Tasks found: ${data.data?.length || 0}`);
        }
      } else if (response.status === 401) {
        console.log('     ❌ Authentication required');
      } else if (response.status === 403) {
        console.log('     ❌ Access forbidden (check permissions)');
      }
    } catch (error) {
      console.log(`   ${endpoint.name}: ❌ Error - ${error.message}`);
    }
  }
}

// Test current page routing
console.log('\n3. Current Page Info:');
console.log('   URL:', window.location.href);
console.log('   Path:', window.location.pathname);

// Check if React Router is working
if (window.location.pathname.includes('/user/legal-cases') || window.location.pathname.includes('/user/legal-tasks')) {
  console.log('   ✅ On correct route');
  
  // Check if component is mounted
  const hasReactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#root > div');
  console.log('   React app mounted:', !!hasReactRoot);
  
  // Check for loading indicators or error messages
  const hasLoader = document.querySelector('.animate-spin') || document.querySelector('[class*="loading"]');
  const hasError = document.querySelector('[class*="error"]') || document.querySelector('.text-red');
  
  console.log('   Loading indicator:', !!hasLoader);
  console.log('   Error message:', !!hasError);
} else {
  console.log('   ⚠️ Not on cases/tasks route');
}

// Run the tests
testEndpoints();

console.log('\n💡 If you see 401/403 errors:');
console.log('1. Make sure you are logged in');
console.log('2. Check if token is valid');
console.log('3. Verify user has proper permissions');
console.log('\n🔧 To fix:');
console.log('1. Go to /login and log in again');
console.log('2. Check browser console for errors');
console.log('3. Verify backend RBAC is set up correctly');