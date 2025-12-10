const db = require('./db');
const { verifyToken } = require('./utils/token');

// Simulate the middleware authentication flow
async function testAuthFlow() {
  try {
    console.log('=== TESTING AUTHENTICATION FLOW ===\n');
    
    // Test 1: Check a lawyer from lawyers table
    console.log('1. TESTING LAWYER AUTHENTICATION:');
    const testLawyer = await db('lawyers').where('id', 1).first();
    console.log('Lawyer data:', {
      id: testLawyer.id,
      name: testLawyer.name,
      email: testLawyer.email,
      is_verified: testLawyer.is_verified,
      lawyer_verified: testLawyer.lawyer_verified
    });
    
    // Simulate requireAuth middleware
    console.log('\n2. SIMULATING requireAuth MIDDLEWARE:');
    let user = await db('users').where('id', testLawyer.id).first();
    if (user) {
      user.role = user.role || 'user';
      console.log('Found in users table:', user.role);
    } else {
      user = await db('lawyers').where('id', testLawyer.id).first();
      if (user) {
        user.role = 'lawyer';
        user.is_verified = user.is_verified || 0;
        user.lawyer_verified = user.lawyer_verified || 0;
        console.log('Found in lawyers table, setting role to: lawyer');
      }
    }
    
    console.log('Final user object:', {
      id: user.id,
      role: user.role,
      is_verified: user.is_verified,
      lawyer_verified: user.lawyer_verified
    });
    
    // Simulate requireLawyer middleware
    console.log('\n3. SIMULATING requireLawyer MIDDLEWARE:');
    const passesLawyerCheck = user.role === 'lawyer';
    console.log('Passes lawyer role check:', passesLawyerCheck);
    
    // Simulate requireVerifiedLawyer middleware
    console.log('\n4. SIMULATING requireVerifiedLawyer MIDDLEWARE:');
    const passesVerifiedCheck = user.role === 'lawyer' && user.is_verified && user.lawyer_verified;
    console.log('Passes verified lawyer check:', passesVerifiedCheck);
    console.log('- Role is lawyer:', user.role === 'lawyer');
    console.log('- Is verified:', !!user.is_verified);
    console.log('- Lawyer verified:', !!user.lawyer_verified);
    
    // Test with a user from users table who has role 'lawyer'
    console.log('\n5. TESTING USER WITH LAWYER ROLE:');
    const userLawyer = await db('users').where('role', 'lawyer').first();
    if (userLawyer) {
      console.log('User-lawyer data:', {
        id: userLawyer.id,
        name: userLawyer.name,
        role: userLawyer.role,
        is_verified: userLawyer.is_verified
      });
      
      // This user would pass requireLawyer but might fail requireVerifiedLawyer
      const passesUserLawyerCheck = userLawyer.role === 'lawyer';
      const passesUserVerifiedCheck = userLawyer.role === 'lawyer' && userLawyer.is_verified && userLawyer.lawyer_verified;
      console.log('User-lawyer passes lawyer check:', passesUserLawyerCheck);
      console.log('User-lawyer passes verified check:', passesUserVerifiedCheck);
    }
    
    console.log('\n=== AUTHENTICATION FLOW TEST COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testAuthFlow();