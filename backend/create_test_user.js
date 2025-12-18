require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const createTestUser = async () => {
  try {
    const email = 'testuser@example.com';
    const password = 'test123';
    const name = 'Test User';
    
    // Check if user exists
    const existing = await db('users').where('email', email).first();
    if (existing) {
      console.log('✅ Test user already exists');
      console.log(`Email: ${email}, Password: ${password}`);
      console.log(`Referral Code: ${existing.referral_code}`);
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = 'TEST123REF';
    
    await db('users').insert({
      name,
      email,
      password: hashedPassword,
      email_verified: 1,
      is_verified: 1,
      referral_code: referralCode,
      secure_id: crypto.randomBytes(16).toString('hex')
    });
    
    console.log('✅ Test user created:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Referral Code: ${referralCode}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
};

createTestUser();