require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/test-payments';

// Test data
const testData = {
  userId: 1,
  lawyerId: 1,
  amount: 150.00,
  description: 'Legal consultation payment test'
};

// Test 1: Create payment to lawyer
const testCreatePayment = async () => {
  console.log('\n🧪 TEST 1: Creating Payment to Lawyer');
  console.log('=====================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/create-payment`, testData);
    
    if (response.data.success) {
      console.log('✅ Payment created successfully!');
      console.log(`Transaction ID: ${response.data.data.transactionId}`);
      console.log(`Payment Intent ID: ${response.data.data.paymentIntentId}`);
      console.log(`Amount: $${response.data.data.amount}`);
      console.log(`Platform Fee: $${response.data.data.platformFee}`);
      console.log(`Lawyer Earnings: $${response.data.data.lawyerEarnings}`);
      console.log(`Lawyer: ${response.data.data.lawyer}`);
      
      return response.data.data.transactionId;
    } else {
      console.log('❌ Payment creation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Payment test failed:', error.response?.data?.error || error.message);
    return null;
  }
};

// Test 2: Fetch payment data
const testFetchPayment = async (transactionId) => {
  console.log('\n🧪 TEST 2: Fetching Payment Data');
  console.log('=================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/payment/${transactionId}`);
    
    if (response.data.success) {
      const { transaction, earnings } = response.data.data;
      
      console.log('✅ Payment data fetched successfully!');
      console.log(`Transaction ID: ${transaction.id}`);
      console.log(`User: ${transaction.user_name || 'Guest'}`);
      console.log(`Lawyer: ${transaction.lawyer_name}`);
      console.log(`Amount: $${transaction.amount}`);
      console.log(`Status: ${transaction.status}`);
      console.log(`Created: ${new Date(transaction.created_at).toLocaleString()}`);
      
      console.log('\n--- Lawyer Earnings Update ---');
      console.log(`Total Earned: $${earnings?.total_earned || 0}`);
      console.log(`Available Balance: $${earnings?.available_balance || 0}`);
      
      return true;
    } else {
      console.log('❌ Fetch payment failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Fetch payment test failed:', error.response?.data?.error || error.message);
    return false;
  }
};

// Test 3: Fetch accounting data
const testFetchAccounting = async (lawyerId) => {
  console.log('\n🧪 TEST 3: Fetching Accounting Data');
  console.log('===================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/accounting/${lawyerId}`);
    
    if (response.data.success) {
      const { transactions, earnings, stats } = response.data.data;
      
      console.log('✅ Accounting data fetched successfully!');
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Completed Transactions: ${stats.completedTransactions}`);
      console.log(`Total Earned: $${stats.totalEarned}`);
      console.log(`Available Balance: $${stats.availableBalance}`);
      console.log(`This Month Earnings: $${stats.monthlyEarnings}`);
      
      console.log('\n--- Recent Transactions ---');
      transactions.slice(0, 5).forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.user_name || 'Guest'} - $${tx.amount} (${tx.status}) - ${new Date(tx.created_at).toLocaleDateString()}`);
      });
      
      return true;
    } else {
      console.log('❌ Fetch accounting failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Fetch accounting test failed:', error.response?.data?.error || error.message);
    return false;
  }
};

// Test 4: Get available lawyers
const testGetLawyers = async () => {
  console.log('\n🧪 TEST 4: Getting Available Lawyers');
  console.log('====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/lawyers`);
    
    if (response.data.success) {
      console.log('✅ Lawyers fetched successfully!');
      console.log(`Found ${response.data.data.length} lawyers:`);
      
      response.data.data.forEach((lawyer, index) => {
        console.log(`${index + 1}. ${lawyer.name} (ID: ${lawyer.id}) - Rate: $${lawyer.consultation_rate || 'Not set'}`);
      });
      
      return true;
    } else {
      console.log('❌ Fetch lawyers failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Fetch lawyers test failed:', error.response?.data?.error || error.message);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Payment API Tests...');
  console.log('=================================');
  
  let results = {
    createPayment: false,
    fetchPayment: false,
    fetchAccounting: false,
    getLawyers: false
  };
  
  // Test 4: Get lawyers first
  results.getLawyers = await testGetLawyers();
  
  // Test 1: Create payment
  const transactionId = await testCreatePayment();
  results.createPayment = transactionId !== null;
  
  if (transactionId) {
    // Test 2: Fetch payment data
    results.fetchPayment = await testFetchPayment(transactionId);
    
    // Test 3: Fetch accounting data
    results.fetchAccounting = await testFetchAccounting(testData.lawyerId);
  }
  
  // Summary
  console.log('\n🎉 Test Results Summary');
  console.log('======================');
  console.log(`Get Lawyers: ${results.getLawyers ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Create Payment: ${results.createPayment ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Fetch Payment: ${results.fetchPayment ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Fetch Accounting: ${results.fetchAccounting ? '✅ PASSED' : '❌ FAILED'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎊 All tests passed! Payment system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
};

// Export for use in other files
module.exports = {
  testCreatePayment,
  testFetchPayment,
  testFetchAccounting,
  testGetLawyers,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}