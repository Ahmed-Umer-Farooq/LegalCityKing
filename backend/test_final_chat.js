const axios = require('axios');
const db = require('./db');

const BASE_URL = 'http://localhost:5001/api';

async function finalTest() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL CHAT SYSTEM TEST WITH SECURE_ID');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Get lawyer
    const lawyer = await db('lawyers').where('email', 'tbumer38@gmail.com').first();
    console.log(`📋 Lawyer: ${lawyer.name}`);
    console.log(`   Database ID: ${lawyer.id}`);
    console.log(`   Secure ID: ${lawyer.secure_id}\n`);
    
    // Login user
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ahmadumer123123@gmail.com',
      password: 'Test@123'
    });
    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log(`👤 User: ${user.email} (ID: ${user.id})\n`);
    
    // Test 1: Send message with secure_id
    console.log('TEST 1: Send message using secure_id');
    console.log('-'.repeat(60));
    const msg = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        sender_id: user.id,
        sender_type: 'user',
        receiver_id: lawyer.secure_id,
        receiver_type: 'lawyer',
        content: 'Hello from final test!'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Message sent! Stored receiver_id: ${msg.data.data.receiver_id} (should be ${lawyer.id})\n`);
    
    // Test 2: Fetch messages with secure_id
    console.log('TEST 2: Fetch messages using secure_id');
    console.log('-'.repeat(60));
    const messages = await axios.get(
      `${BASE_URL}/chat/messages/${lawyer.secure_id}/lawyer`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Found ${messages.data.length} messages\n`);
    
    // Test 3: Check conversations
    console.log('TEST 3: Check conversations list');
    console.log('-'.repeat(60));
    const convs = await axios.get(
      `${BASE_URL}/chat/conversations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const lawyerConv = convs.data.find(c => c.partner_id === lawyer.id);
    if (lawyerConv) {
      console.log(`✅ Conversation found:`);
      console.log(`   Partner Name: "${lawyerConv.partner_name}"`);
      console.log(`   Partner ID: ${lawyerConv.partner_id}`);
      console.log(`   Last Message: "${lawyerConv.last_message}"`);
      
      if (lawyerConv.partner_name === 'Unknown User') {
        console.log('\n❌ FAILED: Showing "Unknown User"!\n');
        process.exit(1);
      }
    } else {
      console.log('\n❌ FAILED: Conversation not found!\n');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! Chat system working correctly!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED!');
    console.log('='.repeat(60));
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

finalTest();
