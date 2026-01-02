const db = require('./db');

async function fixLawyerVerification() {
  try {
    await db('lawyers').where('email', 'lawyer2@law.com').update({
      is_verified: 0,
      lawyer_verified: 0
    });
    console.log('Updated lawyer verification status');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixLawyerVerification();