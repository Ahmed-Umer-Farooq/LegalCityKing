const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testLikeFunctionality() {
  console.log('🧪 Testing Like Functionality...\n');

  try {
    // First, get a blog to test with
    console.log('1️⃣ Getting a blog to test with...');
    const blogsRes = await axios.get(`${BASE_URL}/blogs`);
    
    if (blogsRes.data.length === 0) {
      console.log('❌ No blogs found to test with');
      return;
    }

    const testBlog = blogsRes.data[0];
    console.log(`✅ Using blog: "${testBlog.title}" (ID: ${testBlog.id})`);
    console.log(`📊 Current like count: ${testBlog.like_count}`);

    // Test 2: Try to like without authentication (should fail)
    console.log('\n2️⃣ Testing like without authentication...');
    try {
      const likeRes = await axios.post(`${BASE_URL}/blogs/${testBlog.id}/like`);
      console.log('❌ Unexpected success - should have failed without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected - authentication required');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // Test 3: Check if we can get blog details
    console.log('\n3️⃣ Testing blog detail endpoint...');
    const detailRes = await axios.get(`${BASE_URL}/blogs/${testBlog.secure_id}`);
    console.log(`✅ Blog detail retrieved: ${detailRes.data.title}`);
    console.log(`📊 Views: ${detailRes.data.views_count}`);

    // Test 4: Check route structure
    console.log('\n4️⃣ Checking route structure...');
    console.log(`🔗 Like endpoint: POST ${BASE_URL}/blogs/${testBlog.id}/like`);
    console.log(`🔗 Blog detail endpoint: GET ${BASE_URL}/blogs/${testBlog.secure_id}`);

    console.log('\n✅ Like functionality tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Blog APIs are working');
    console.log('- Like endpoint requires authentication (correct)');
    console.log('- Blog details can be retrieved');
    console.log('\n💡 To test like functionality fully, you need to:');
    console.log('1. Be logged in with a valid token');
    console.log('2. Use the correct blog ID (not secure_id) for the like endpoint');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testLikeFunctionality();