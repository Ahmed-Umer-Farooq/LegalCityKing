const express = require('express');
const db = require('./db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Test 1: Create payment to lawyer from user dashboard
const testPaymentToLawyer = async () => {
  console.log('\n=== TEST 1: Payment to Lawyer ===');
  
  try {
    // Mock user and lawyer data
    const userId = 1; // Test user ID
    const lawyerId = 1; // Test lawyer ID
    const amount = 150.00; // $150 consultation fee
    const description = 'Legal consultation payment';

    // Get lawyer details
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    console.log(`Creating payment: $${amount} to ${lawyer.name}`);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        user_id: userId,
        lawyer_id: lawyerId,
        description: description
      }
    });

    // Calculate fees
    const platformFee = amount * 0.05; // 5% platform fee
    const lawyerEarnings = amount - platformFee;

    // Save transaction to database
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: paymentIntent.id,
      user_id: userId,
      lawyer_id: lawyerId,
      amount: amount,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'consultation',
      status: 'completed',
      description: description,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Update lawyer earnings
    await db.raw(`
      INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      total_earned = total_earned + ?,
      available_balance = available_balance + ?,
      updated_at = NOW()
    `, [lawyerId, lawyerEarnings, lawyerEarnings, lawyerEarnings, lawyerEarnings]);

    console.log('✅ Payment created successfully');
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`Payment Intent ID: ${paymentIntent.id}`);
    console.log(`Amount: $${amount}`);
    console.log(`Platform Fee: $${platformFee}`);
    console.log(`Lawyer Earnings: $${lawyerEarnings}`);

    return {
      success: true,
      transactionId,
      paymentIntentId: paymentIntent.id,
      amount,
      platformFee,
      lawyerEarnings
    };

  } catch (error) {
    console.error('❌ Payment test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test 2: Fetch updated payment data
const testFetchPaymentData = async (transactionId) => {
  console.log('\n=== TEST 2: Fetch Payment Data ===');
  
  try {
    // Fetch transaction details
    const transaction = await db('transactions')
      .select('transactions.*', 'users.name as user_name', 'lawyers.name as lawyer_name')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.id', transactionId)
      .first();

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log('✅ Transaction fetched successfully');
    console.log(`Transaction ID: ${transaction.id}`);
    console.log(`User: ${transaction.user_name || 'Guest'}`);
    console.log(`Lawyer: ${transaction.lawyer_name}`);
    console.log(`Amount: $${transaction.amount}`);
    console.log(`Status: ${transaction.status}`);
    console.log(`Created: ${transaction.created_at}`);

    // Fetch lawyer's updated earnings
    const earnings = await db('earnings').where('lawyer_id', transaction.lawyer_id).first();
    
    console.log('\n--- Lawyer Earnings Update ---');
    console.log(`Total Earned: $${earnings?.total_earned || 0}`);
    console.log(`Available Balance: $${earnings?.available_balance || 0}`);

    return {
      success: true,
      transaction,
      earnings
    };

  } catch (error) {
    console.error('❌ Fetch payment data test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test 3: Fetch accounting/payment history
const testFetchAccountingData = async (lawyerId) => {
  console.log('\n=== TEST 3: Fetch Accounting Data ===');
  
  try {
    // Get all transactions for the lawyer
    const transactions = await db('transactions')
      .select('transactions.*', 'users.name as user_name')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where('transactions.lawyer_id', lawyerId)
      .orderBy('transactions.created_at', 'desc');

    // Get earnings summary
    const earnings = await db('earnings').where('lawyer_id', lawyerId).first();

    // Calculate monthly earnings
    const monthlyEarnings = await db('transactions')
      .where('lawyer_id', lawyerId)
      .where('status', 'completed')
      .whereRaw('MONTH(created_at) = MONTH(CURRENT_DATE())')
      .whereRaw('YEAR(created_at) = YEAR(CURRENT_DATE())')
      .sum('lawyer_earnings as total');

    console.log('✅ Accounting data fetched successfully');
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Total Earned: $${earnings?.total_earned || 0}`);
    console.log(`Available Balance: $${earnings?.available_balance || 0}`);
    console.log(`This Month Earnings: $${monthlyEarnings[0].total || 0}`);

    console.log('\n--- Recent Transactions ---');
    transactions.slice(0, 5).forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.user_name || 'Guest'} - $${tx.amount} (${tx.status})`);
    });

    return {
      success: true,
      transactions,
      earnings,
      monthlyEarnings: monthlyEarnings[0].total || 0
    };

  } catch (error) {
    console.error('❌ Fetch accounting data test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Run all tests
const runPaymentTests = async () => {
  console.log('🚀 Starting Payment API Tests...');
  
  // Test 1: Create payment
  const paymentResult = await testPaymentToLawyer();
  if (!paymentResult.success) {
    console.log('❌ Payment test failed, stopping tests');
    return;
  }

  // Test 2: Fetch payment data
  const fetchResult = await testFetchPaymentData(paymentResult.transactionId);
  if (!fetchResult.success) {
    console.log('❌ Fetch test failed');
    return;
  }

  // Test 3: Fetch accounting data
  const accountingResult = await testFetchAccountingData(1); // Test lawyer ID 1
  
  console.log('\n🎉 All payment tests completed!');
  console.log('Summary:');
  console.log(`- Payment Created: ${paymentResult.success ? '✅' : '❌'}`);
  console.log(`- Data Fetched: ${fetchResult.success ? '✅' : '❌'}`);
  console.log(`- Accounting Updated: ${accountingResult.success ? '✅' : '❌'}`);
};

// Export for use in other files
module.exports = {
  testPaymentToLawyer,
  testFetchPaymentData,
  testFetchAccountingData,
  runPaymentTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPaymentTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}