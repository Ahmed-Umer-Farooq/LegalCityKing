require('dotenv').config();
const db = require('./db');

const checkLawyerAccounts = async () => {
  try {
    console.log('🔍 Checking lawyer accounts...');
    
    const lawyers = await db('lawyers').select('id', 'name', 'email', 'registration_id', 'password');
    console.log(`Found ${lawyers.length} lawyer accounts:`);
    lawyers.forEach(lawyer => {
      console.log(`- ID: ${lawyer.id}, Name: ${lawyer.name}, Email: ${lawyer.email}, Reg ID: ${lawyer.registration_id}, Has Password: ${lawyer.password ? 'Yes' : 'No'}`);
    });
    
    console.log('\n🔍 Checking users table for comparison...');
    const users = await db('users').select('id', 'name', 'email').limit(5);
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkLawyerAccounts();