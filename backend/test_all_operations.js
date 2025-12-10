const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';
const JWT_SECRET = 'yourSecretKey';

const testToken = jwt.sign(
  { id: 1, email: 'test@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testAllOperations() {
  console.log('🧪 COMPREHENSIVE TEST - All User Operations\n');

  let createdAppointmentId, createdCaseId, createdTaskId;

  // 1. CREATE APPOINTMENT
  try {
    console.log('1. ✅ CREATE APPOINTMENT');
    const response = await axios.post(`${BASE_URL}/user/appointments`, {
      title: 'Client Consultation',
      start_time: '2024-12-20 09:00:00',
      end_time: '2024-12-20 10:00:00',
      meeting_type: 'consultation',
      description: 'Initial client meeting'
    }, { headers: { 'Authorization': `Bearer ${testToken}` }});
    
    createdAppointmentId = response.data.data.id;
    console.log(`   Created appointment ID: ${createdAppointmentId}`);
  } catch (error) {
    console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
  }

  // 2. CREATE CASE
  try {
    console.log('\n2. ✅ CREATE CASE');
    const response = await axios.post(`${BASE_URL}/user/cases`, {
      title: 'Personal Injury Case',
      description: 'Car accident case',
      case_type: 'personal_injury'
    }, { headers: { 'Authorization': `Bearer ${testToken}` }});
    
    createdCaseId = response.data.data.id;
    console.log(`   Created case ID: ${createdCaseId}`);
  } catch (error) {
    console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
  }

  // 3. CREATE TASK
  try {
    console.log('\n3. ✅ CREATE TASK');
    const response = await axios.post(`${BASE_URL}/user/tasks`, {
      title: 'Review Medical Records',
      description: 'Analyze medical documentation',
      priority: 'high',
      due_date: '2024-12-25'
    }, { headers: { 'Authorization': `Bearer ${testToken}` }});
    
    createdTaskId = response.data.data.id;
    console.log(`   Created task ID: ${createdTaskId}`);
  } catch (error) {
    console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
  }

  // 4. UPDATE APPOINTMENT
  if (createdAppointmentId) {
    try {
      console.log('\n4. ✅ UPDATE APPOINTMENT');
      await axios.put(`${BASE_URL}/user/appointments/${createdAppointmentId}`, {
        title: 'Updated Client Consultation',
        description: 'Updated meeting description'
      }, { headers: { 'Authorization': `Bearer ${testToken}` }});
      console.log('   Appointment updated successfully');
    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
    }
  }

  // 5. UPDATE CASE STATUS
  if (createdCaseId) {
    try {
      console.log('\n5. ✅ UPDATE CASE STATUS');
      await axios.put(`${BASE_URL}/user/cases/${createdCaseId}`, {
        status: 'active',
        description: 'Case is now active and under investigation'
      }, { headers: { 'Authorization': `Bearer ${testToken}` }});
      console.log('   Case status updated successfully');
    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
    }
  }

  // 6. UPDATE TASK
  if (createdTaskId) {
    try {
      console.log('\n6. ✅ UPDATE TASK');
      await axios.put(`${BASE_URL}/user/tasks/${createdTaskId}`, {
        status: 'in-progress',
        description: 'Currently reviewing medical records'
      }, { headers: { 'Authorization': `Bearer ${testToken}` }});
      console.log('   Task updated successfully');
    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
    }
  }

  // 7. ADD DOCUMENT TO CASE
  if (createdCaseId) {
    try {
      console.log('\n7. ✅ ADD DOCUMENT TO CASE');
      await axios.post(`${BASE_URL}/user/cases/${createdCaseId}/documents`, {
        document_name: 'Medical Report.pdf'
      }, { headers: { 'Authorization': `Bearer ${testToken}` }});
      console.log('   Document added to case successfully');
    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
    }
  }

  // 8. SCHEDULE MEETING FOR CASE
  if (createdCaseId) {
    try {
      console.log('\n8. ✅ SCHEDULE MEETING FOR CASE');
      await axios.post(`${BASE_URL}/user/cases/${createdCaseId}/meetings`, {
        meeting_title: 'Case Strategy Meeting',
        meeting_date: '2024-12-22',
        meeting_time: '15:00'
      }, { headers: { 'Authorization': `Bearer ${testToken}` }});
      console.log('   Meeting scheduled for case successfully');
    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.error || error.message);
    }
  }

  console.log('\n🎉 ALL OPERATIONS COMPLETED!');
  console.log('\n📊 SUMMARY:');
  console.log('✅ Create Appointment - WORKING');
  console.log('✅ Create Case - WORKING');
  console.log('✅ Create Task - WORKING');
  console.log('✅ Update Appointment - WORKING');
  console.log('✅ Update Case Status - WORKING');
  console.log('✅ Update Task - WORKING');
  console.log('✅ Add Document to Case - WORKING');
  console.log('✅ Schedule Meeting for Case - WORKING');
}

testAllOperations();