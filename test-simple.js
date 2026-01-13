const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`${description}: Status ${res.statusCode}`);
      if (res.statusCode === 401) {
        console.log('✅ Endpoint exists (auth required)');
      } else if (res.statusCode === 404) {
        console.log('❌ Endpoint not found');
      } else {
        console.log('✅ Endpoint accessible');
      }
      resolve();
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`${description}: ❌ Server not running on port 5001`);
      } else {
        console.log(`${description}: ⚠️ Error - ${err.message}`);
      }
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing User Cases and Tasks Endpoints...\n');
  
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/api/user/cases', 'User Cases');
  await testEndpoint('/api/user/tasks', 'User Tasks');
  
  console.log('\n📋 Next steps if server is not running:');
  console.log('1. cd backend');
  console.log('2. npm start');
}

runTests();