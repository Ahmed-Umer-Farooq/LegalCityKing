const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';
const JWT_SECRET = 'yourSecretKey'; // From your .env file

// Create test token for user ID 1
const testToken = jwt.sign(
  { id: 1, email: 'test@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testPostOperations() {
  console.log('🧪 Testing POST/PUT Operations...\n');

  // Test 1: Create Appointment
  try {
    console.log('1. Testing Create Appointment...');
    const appointmentData = {
      title: 'Test Appointment',
      start_time: '2024-12-15 10:00:00',
      end_time: '2024-12-15 11:00:00',
      meeting_type: 'consultation',
      description: 'Test appointment description'
    };

    const response = await axios.post(`${BASE_URL}/user/appointments`, appointmentData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Appointment created:', response.data);
  } catch (error) {
    console.log('❌ Appointment creation failed:', error.response?.data || error.message);
  }

  // Test 2: Create Case
  try {
    console.log('\n2. Testing Create Case...');
    const caseData = {
      title: 'Test Case',
      description: 'Test case description',
      case_type: 'civil'
    };

    const response = await axios.post(`${BASE_URL}/user/cases`, caseData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Case created:', response.data);
  } catch (error) {
    console.log('❌ Case creation failed:', error.response?.data || error.message);
  }

  // Test 3: Create Task
  try {
    console.log('\n3. Testing Create Task...');
    const taskData = {
      title: 'Test Task',
      description: 'Test task description',
      priority: 'medium',
      due_date: '2024-12-20'
    };

    const response = await axios.post(`${BASE_URL}/user/tasks`, taskData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Task created:', response.data);
  } catch (error) {
    console.log('❌ Task creation failed:', error.response?.data || error.message);
  }

  // Test 4: Update Task (assuming task ID 1 exists)
  try {
    console.log('\n4. Testing Update Task...');
    const updateData = {
      status: 'in-progress',
      description: 'Updated task description'
    };

    const response = await axios.put(`${BASE_URL}/user/tasks/1`, updateData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Task updated:', response.data);
  } catch (error) {
    console.log('❌ Task update failed:', error.response?.data || error.message);
  }

  // Test 5: Add Document to Case (assuming case ID 1 exists)
  try {
    console.log('\n5. Testing Add Document to Case...');
    const docData = {
      document_name: 'Test Document.pdf'
    };

    const response = await axios.post(`${BASE_URL}/user/cases/1/documents`, docData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Document added:', response.data);
  } catch (error) {
    console.log('❌ Document addition failed:', error.response?.data || error.message);
  }

  // Test 6: Schedule Meeting for Case
  try {
    console.log('\n6. Testing Schedule Meeting for Case...');
    const meetingData = {
      meeting_title: 'Case Review Meeting',
      meeting_date: '2024-12-18',
      meeting_time: '14:00'
    };

    const response = await axios.post(`${BASE_URL}/user/cases/1/meetings`, meetingData, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log('✅ Meeting scheduled:', response.data);
  } catch (error) {
    console.log('❌ Meeting scheduling failed:', error.response?.data || error.message);
  }
}

testPostOperations();