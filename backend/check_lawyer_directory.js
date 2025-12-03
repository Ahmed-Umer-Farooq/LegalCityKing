require('dotenv').config();
const db = require('./db');

async function checkLawyerDirectory() {
  console.log('🔍 Checking Lawyer Directory Visibility...\n');
  
  try {
    // Check the lawyer's directory status
    const lawyer = await db('lawyers')
      .where('email', 'tbumer38@gmail.com')
      .select('id', 'secure_id', 'name', 'email', 'is_verified', 'lawyer_verified', 'subscription_tier', 'speciality', 'city', 'state')
      .first();
    
    if (lawyer) {
      console.log('📋 Lawyer Details:');
      console.log(`   - ID: ${lawyer.id}`);
      console.log(`   - Secure ID: ${lawyer.secure_id}`);
      console.log(`   - Name: ${lawyer.name}`);
      console.log(`   - Email: ${lawyer.email}`);
      console.log(`   - Verified: ${lawyer.is_verified ? 'Yes' : 'No'}`);
      console.log(`   - Lawyer Verified: ${lawyer.lawyer_verified ? 'Yes' : 'No'}`);
      console.log(`   - Subscription: ${lawyer.subscription_tier}`);
      console.log(`   - Speciality: ${lawyer.speciality || 'Not set'}`);
      console.log(`   - Location: ${lawyer.city || 'Not set'}, ${lawyer.state || 'Not set'}`);
      
      // Check if lawyer appears in directory API
      const directoryLawyers = await db('lawyers')
        .select('secure_id', 'name', 'email', 'speciality', 'city', 'state', 'is_verified')
        .where('is_verified', 1);
      
      const isInDirectory = directoryLawyers.find(l => l.secure_id === lawyer.secure_id);
      
      console.log(`\n🌐 Directory Status: ${isInDirectory ? '✅ Visible' : '❌ Not visible'}`);
      
      if (isInDirectory) {
        console.log('\n🎯 Lawyer Profile URL:');
        console.log(`   http://localhost:3000/lawyer/${lawyer.secure_id}`);
        console.log('\n✅ Users can find this lawyer and make payments!');
      } else {
        console.log('\n❌ Lawyer not visible in directory');
        console.log('   Reason: is_verified = 0');
      }
      
    } else {
      console.log('❌ Lawyer not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkLawyerDirectory();