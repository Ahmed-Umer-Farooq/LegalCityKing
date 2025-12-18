require('dotenv').config();
const db = require('./db');

const generateReferralCodes = async () => {
  try {
    console.log('🔧 Generating referral codes for existing users...');
    
    const users = await db('users').whereNull('referral_code');
    console.log(`Found ${users.length} users without referral codes`);
    
    for (const user of users) {
      const prefix = user.name.substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const referralCode = `${prefix}${random}`;
      
      await db('users').where('id', user.id).update({ referral_code: referralCode });
      console.log(`✅ Generated code ${referralCode} for ${user.name}`);
    }
    
    console.log('✅ All users now have referral codes');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

generateReferralCodes();