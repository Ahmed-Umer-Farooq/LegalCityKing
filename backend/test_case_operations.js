const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';
const JWT_SECRET = 'yourSecretKey';

const testToken = jwt.sign(
  { id: 1, email: 'test@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testCaseOperations() {
  console.log('🧪 Testing Case Operations with Case ID 3...\n');

  // Test 1: Add Document to Case
  try {
    console.log('1. Testing Add Document to Case...');
    const docData = {
      document_name: 'Contract.pdf'
    };

    const response = await axios.post(`${BASE_URL}/user/cases/3/documents`, docData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Document added:', response.data);
  } catch (error) {
    console.log('❌ Document addition failed:', error.response?.data || error.message);
  }

  // Test 2: Schedule Meeting for Case
  try {
    console.log('\n2. Testing Schedule Meeting for Case...');
    const meetingData = {
      meeting_title: 'Case Review Meeting',
      meeting_date: '2024-12-18',
      meeting_time: '14:00'
    };

    const response = await axios.post(`${BASE_URL}/user/cases/3/meetings`, meetingData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Meeting scheduled:', response.data);
  } catch (error) {
    console.log('❌ Meeting scheduling failed:', error.response?.data || error.message);
  }

  // Test 3: Update Case Status
  try {
    console.log('\n3. Testing Update Case Status...');
    const updateData = {
      status: 'active',
      description: 'Updated case description with new status'
    };

    const response = await axios.put(`${BASE_URL}/user/cases/3`, updateData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Case updated:', response.data);
  } catch (error) {
    console.log('❌ Case update failed:', error.response?.data || error.message);
  }

  // Test 4: Get updated case to verify changes
  try {
    console.log('\n4. Getting updated case...');
    const response = await axios.get(`${BASE_URL}/user/cases`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    const case3 = response.data.data.find(c => c.id === 3);
    console.log('✅ Updated case:', case3);
  } catch (error) {
    console.log('❌ Get case failed:', error.response?.data || error.message);
  }
}

testCaseOperations();