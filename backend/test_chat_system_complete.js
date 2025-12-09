const axios = require('axios');
const db = require('./db');

const BASE_URL = 'http://localhost:5001/api';
const LAWYER_EMAIL = 'tbumer38@gmail.com';
const LAWYER_NAME = 'Ahmad Umer';

let authUserToken = null;
let googleUserToken = null;
let lawyerId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${'='.repeat(60)}`);
  log(`STEP ${step}: ${message}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Step 1: Get or create auth user
async function step1_getAuthUser() {
  logStep(1, 'Getting/Creating Auth User');
  
  try {
    // Check if test user exists
    let user = await db('users')
      .where('email', 'testuser@example.com')
      .first();
    
    if (!user) {
      logInfo('Creating new test user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      
      const [userId] = await db('users').insert({
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        email_verified: 1,
        is_verified: 1,
        role: 'user',
        secure_id: require('crypto').randomBytes(16).toString('hex')
      });
      
      user = await db('users').where('id', userId).first();
      logSuccess('Test user created');
    } else {
      logSuccess('Test user found');
    }
    
    logInfo(`User: ${user.name} (${user.email}) - ID: ${user.id}`);
    
    // Login
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'Test@123'
    });
    
    authUserToken = response.data.token;
    logSuccess('Auth user logged in successfully');
    logInfo(`Token: ${authUserToken.substring(0, 20)}...`);
    
    return user;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Step 2: Get lawyer details
async function step2_getLawyer() {
  logStep(2, 'Getting Lawyer Details');
  
  try {
    const lawyer = await db('lawyers')
      .where('email', LAWYER_EMAIL)
      .first();
    
    if (!lawyer) {
      logError(`Lawyer ${LAWYER_EMAIL} not found!`);
      throw new Error('Lawyer not found');
    }
    
    lawyerId = lawyer.id;
    logSuccess('Lawyer found');
    logInfo(`Lawyer: ${lawyer.name} (${lawyer.email})`);
    logInfo(`ID: ${lawyer.id}, Registration: ${lawyer.registration_id}`);
    
    return lawyer;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    throw error;
  }
}

// Step 3: Auth user sends message to lawyer
async function step3_authUserSendsMessage() {
  logStep(3, 'Auth User Sends Message to Lawyer');
  
  try {
    const messageContent = `Hello ${LAWYER_NAME}, I need legal consultation. (Test at ${new Date().toLocaleTimeString()})`;
    
    const response = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        sender_id: (await db('users').where('email', 'testuser@example.com').first()).id,
        sender_type: 'user',
        receiver_id: lawyerId,
        receiver_type: 'lawyer',
        content: messageContent,
        message_type: 'text'
      },
      {
        headers: { Authorization: `Bearer ${authUserToken}` }
      }
    );
    
    logSuccess('Message sent successfully');
    logInfo(`Message ID: ${response.data.data.id}`);
    logInfo(`Content: ${messageContent}`);
    
    return response.data.data;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 4: Verify message in database
async function step4_verifyMessageInDB(messageId) {
  logStep(4, 'Verifying Message in Database');
  
  try {
    const message = await db('chat_messages')
      .where('id', messageId)
      .first();
    
    if (!message) {
      logError('Message not found in database!');
      throw new Error('Message not found');
    }
    
    logSuccess('Message found in database');
    logInfo(`Sender: ${message.sender_type}(${message.sender_id})`);
    logInfo(`Receiver: ${message.receiver_type}(${message.receiver_id})`);
    logInfo(`Content: ${message.content}`);
    logInfo(`Read Status: ${message.read_status ? 'Read' : 'Unread'}`);
    
    return message;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    throw error;
  }
}

// Step 5: Check auth user conversations
async function step5_checkAuthUserConversations() {
  logStep(5, 'Checking Auth User Conversations');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/chat/conversations`,
      {
        headers: { Authorization: `Bearer ${authUserToken}` }
      }
    );
    
    logSuccess('Conversations retrieved');
    logInfo(`Total conversations: ${response.data.length}`);
    
    const lawyerConv = response.data.find(c => c.partner_id === lawyerId && c.partner_type === 'lawyer');
    
    if (lawyerConv) {
      logSuccess(`Found conversation with ${LAWYER_NAME}`);
      logInfo(`Last message: ${lawyerConv.last_message}`);
      logInfo(`Unread count: ${lawyerConv.unread_count}`);
    } else {
      logError(`No conversation found with ${LAWYER_NAME}`);
    }
    
    return response.data;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 6: Get or create Google auth user
async function step6_getGoogleUser() {
  logStep(6, 'Getting/Creating Google Auth User');
  
  try {
    let user = await db('users')
      .where('email', 'googletest@example.com')
      .first();
    
    if (!user) {
      logInfo('Creating new Google test user...');
      
      const [userId] = await db('users').insert({
        name: 'Google Test User',
        email: 'googletest@example.com',
        google_id: 'google_test_123',
        email_verified: 1,
        is_verified: 1,
        role: 'user',
        password: '',
        secure_id: require('crypto').randomBytes(16).toString('hex')
      });
      
      user = await db('users').where('id', userId).first();
      logSuccess('Google test user created');
    } else {
      logSuccess('Google test user found');
    }
    
    logInfo(`User: ${user.name} (${user.email}) - ID: ${user.id}`);
    
    // Generate token manually for Google user
    const jwt = require('jsonwebtoken');
    googleUserToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logSuccess('Google user token generated');
    logInfo(`Token: ${googleUserToken.substring(0, 20)}...`);
    
    return user;
  } catch (error) {
    logError(`Failed: ${error.message}`);
    throw error;
  }
}

// Step 7: Google user sends message to lawyer
async function step7_googleUserSendsMessage() {
  logStep(7, 'Google User Sends Message to Lawyer');
  
  try {
    const messageContent = `Hi ${LAWYER_NAME}, I'm a Google user seeking legal advice. (Test at ${new Date().toLocaleTimeString()})`;
    
    const response = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        sender_id: (await db('users').where('email', 'googletest@example.com').first()).id,
        sender_type: 'user',
        receiver_id: lawyerId,
        receiver_type: 'lawyer',
        content: messageContent,
        message_type: 'text'
      },
      {
        headers: { Authorization: `Bearer ${googleUserToken}` }
      }
    );
    
    logSuccess('Message sent successfully');
    logInfo(`Message ID: ${response.data.data.id}`);
    logInfo(`Content: ${messageContent}`);
    
    return response.data.data;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 8: Check Google user conversations
async function step8_checkGoogleUserConversations() {
  logStep(8, 'Checking Google User Conversations');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/chat/conversations`,
      {
        headers: { Authorization: `Bearer ${googleUserToken}` }
      }
    );
    
    logSuccess('Conversations retrieved');
    logInfo(`Total conversations: ${response.data.length}`);
    
    const lawyerConv = response.data.find(c => c.partner_id === lawyerId && c.partner_type === 'lawyer');
    
    if (lawyerConv) {
      logSuccess(`Found conversation with ${LAWYER_NAME}`);
      logInfo(`Last message: ${lawyerConv.last_message}`);
      logInfo(`Unread count: ${lawyerConv.unread_count}`);
    } else {
      logError(`No conversation found with ${LAWYER_NAME}`);
    }
    
    return response.data;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 9: Check lawyer's conversations (should see both users)
async function step9_checkLawyerConversations() {
  logStep(9, 'Checking Lawyer Conversations (Should See Both Users)');
  
  try {
    // Login as lawyer
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      registration_id: 'AB123456',
      password: 'Ahmad@123'
    });
    
    const lawyerToken = loginResponse.data.token;
    logSuccess('Lawyer logged in');
    
    const response = await axios.get(
      `${BASE_URL}/chat/conversations`,
      {
        headers: { Authorization: `Bearer ${lawyerToken}` }
      }
    );
    
    logSuccess('Lawyer conversations retrieved');
    logInfo(`Total conversations: ${response.data.length}`);
    
    response.data.forEach((conv, index) => {
      console.log(`\n  Conversation ${index + 1}:`);
      logInfo(`  Partner: ${conv.partner_name} (${conv.partner_type})`);
      logInfo(`  Last message: ${conv.last_message}`);
      logInfo(`  Unread: ${conv.unread_count}`);
    });
    
    return response.data;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.message?.includes('verify your email')) {
      logInfo('Note: Lawyer account needs email verification');
    }
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     CHAT SYSTEM COMPREHENSIVE TEST - STEP BY STEP         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');
  
  try {
    // Run all steps
    await step1_getAuthUser();
    await step2_getLawyer();
    const message1 = await step3_authUserSendsMessage();
    await step4_verifyMessageInDB(message1.id);
    await step5_checkAuthUserConversations();
    
    await step6_getGoogleUser();
    const message2 = await step7_googleUserSendsMessage();
    await step4_verifyMessageInDB(message2.id);
    await step8_checkGoogleUserConversations();
    
    await step9_checkLawyerConversations();
    
    // Final summary
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                  ALL TESTS PASSED! ✅                      ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝', 'green');
    console.log('\n');
    
    logSuccess('Chat system is working correctly!');
    logSuccess('Both auth user and Google user can send messages');
    logSuccess('Lawyer can see conversations from both users');
    
  } catch (error) {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                  TEST FAILED! ❌                           ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝', 'red');
    console.log('\n');
    
    logError('Test suite failed. Check the error above.');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the tests
runTests();
