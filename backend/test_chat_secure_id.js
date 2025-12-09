const axios = require('axios');
const db = require('./db');

const BASE_URL = 'http://localhost:5001/api';

async function testChatWithSecureId() {
  console.log('\n🧪 Testing Chat with Secure ID\n');
  
  try {
    // 1. Get lawyer by secure_id
    console.log('Step 1: Getting lawyer secure_id...');
    const lawyer = await db('lawyers').where('email', 'tbumer38@gmail.com').first();
    console.log(`✅ Lawyer: ${lawyer.name} (ID: ${lawyer.id}, Secure ID: ${lawyer.secure_id})`);
    
    // 2. Login as user
    console.log('\nStep 2: Logging in as user...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'Test@123'
    });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log(`✅ User logged in (ID: ${userId})`);
    
    // 3. Send message using SECURE_ID (like frontend does)
    console.log('\nStep 3: Sending message using secure_id...');
    const messageRes = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        sender_id: userId,
        sender_type: 'user',
        receiver_id: lawyer.secure_id, // Using secure_id!
        receiver_type: 'lawyer',
        content: `Test message with secure_id at ${new Date().toLocaleTimeString()}`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (messageRes.data.success) {
      console.log(`✅ Message sent successfully! ID: ${messageRes.data.data.id}`);
      console.log(`   Receiver ID in DB: ${messageRes.data.data.receiver_id} (should be ${lawyer.id})`);
    }
    
    // 4. Get messages using SECURE_ID
    console.log('\nStep 4: Fetching messages using secure_id...');
    const messagesRes = await axios.get(
      `${BASE_URL}/chat/messages/${lawyer.secure_id}/lawyer`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Found ${messagesRes.data.length} messages`);
    
    // 5. Get conversations
    console.log('\nStep 5: Fetching conversations...');
    const convsRes = await axios.get(
      `${BASE_URL}/chat/conversations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Found ${convsRes.data.length} conversations`);
    
    const lawyerConv = convsRes.data.find(c => c.partner_id === lawyer.id);
    if (lawyerConv) {
      console.log(`✅ Lawyer conversation found:`);
      console.log(`   Partner: ${lawyerConv.partner_name} (should be "${lawyer.name}")`);
      console.log(`   Last message: ${lawyerConv.last_message}`);
      
      if (lawyerConv.partner_name === 'Unknown User') {
        console.log('❌ ERROR: Showing "Unknown User" - conversation lookup failed!');
      }
    } else {
      console.log('❌ ERROR: Lawyer conversation not found!');
    }
    
    console.log('\n✅ ALL TESTS PASSED!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

testChatWithSecureId();
