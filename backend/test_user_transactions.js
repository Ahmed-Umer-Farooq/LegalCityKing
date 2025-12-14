require('dotenv').config();
const db = require('./db');

const testUserTransactions = async () => {
  console.log('🔍 Testing User Transactions...');
  
  try {
    // Check if user exists with email ahmadumer123123@gmail.com
    const user = await db('users').where('email', 'ahmadumer123123@gmail.com').first();
    console.log('User found:', user ? `ID: ${user.id}, Name: ${user.name}` : 'Not found');
    
    // Check all transactions
    const allTransactions = await db('transactions')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);
    
    console.log(`\nTotal recent transactions: ${allTransactions.length}`);
    allTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ID: ${tx.id}, User ID: ${tx.user_id}, Amount: $${tx.amount}, Status: ${tx.status}, Date: ${tx.created_at}`);
    });
    
    // Check transactions for this specific user
    if (user) {
      const userTransactions = await db('transactions')
        .select('transactions.*', 'lawyers.name as lawyer_name')
        .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
        .where('transactions.user_id', user.id)
        .orderBy('transactions.created_at', 'desc');
      
      console.log(`\nTransactions for user ${user.email}: ${userTransactions.length}`);
      userTransactions.forEach((tx, i) => {
        console.log(`${i+1}. ${tx.description} - $${tx.amount} to ${tx.lawyer_name} (${tx.status})`);
      });
    }
    
    // Check if there are transactions without user_id (guest payments)
    const guestTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .whereNull('transactions.user_id')
      .orderBy('transactions.created_at', 'desc');
    
    console.log(`\nGuest transactions (no user_id): ${guestTransactions.length}`);
    guestTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description} - $${tx.amount} to ${tx.lawyer_name} (${tx.status}) - ${tx.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testUserTransactions();