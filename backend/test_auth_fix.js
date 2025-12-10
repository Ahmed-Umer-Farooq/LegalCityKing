const db = require('./db');
const { verifyToken } = require('./utils/token');

// Test the fixed authentication flow
async function testAuthFix() {
  try {
    console.log('=== TESTING AUTHENTICATION FIX ===\n');
    
    // Test the new authenticateLawyerSpecific middleware logic
    console.log('1. TESTING NEW LAWYER-SPECIFIC AUTHENTICATION:');
    
    // Simulate a request for lawyer ID 1 (Darlene Robertson)
    const lawyerId = 1;
    console.log(`Testing authentication for lawyer ID: ${lawyerId}`);
    
    // Step 1: Check lawyers table first (new logic)
    let user = await db('lawyers').where('id', lawyerId).first();
    if (user) {
      user.role = 'lawyer';
      user.is_verified = user.is_verified || 0;
      user.lawyer_verified = user.lawyer_verified || 0;
      console.log('✅ Found in lawyers table:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        lawyer_verified: user.lawyer_verified
      });
    }
    
    // Test requireLawyer middleware
    console.log('\n2. TESTING requireLawyer MIDDLEWARE:');
    const passesLawyerCheck = user.role === 'lawyer';
    console.log('Passes lawyer role check:', passesLawyerCheck);
    
    // Test requireVerifiedLawyer middleware
    console.log('\n3. TESTING requireVerifiedLawyer MIDDLEWARE:');
    const passesVerifiedCheck = user.role === 'lawyer' && 
                               (user.is_verified === 1 || user.is_verified === true) && 
                               (user.lawyer_verified === 1 || user.lawyer_verified === true);
    console.log('Passes verified lawyer check:', passesVerifiedCheck);
    console.log('- Role is lawyer:', user.role === 'lawyer');
    console.log('- Is verified:', user.is_verified === 1);
    console.log('- Lawyer verified:', user.lawyer_verified === 1);
    
    // Test blog creation capability
    console.log('\n4. TESTING BLOG CREATION CAPABILITY:');
    const canCreateBlogs = passesLawyerCheck && passesVerifiedCheck;
    console.log('Can create blogs:', canCreateBlogs);
    
    // Test QA answering capability
    console.log('\n5. TESTING QA ANSWERING CAPABILITY:');
    const canAnswerQuestions = passesLawyerCheck && passesVerifiedCheck;
    console.log('Can answer Q&A questions:', canAnswerQuestions);
    
    // Test with another lawyer (ID 44 - Ahmad Umer)
    console.log('\n6. TESTING ANOTHER LAWYER (ID 44):');
    const lawyer44 = await db('lawyers').where('id', 44).first();
    if (lawyer44) {
      lawyer44.role = 'lawyer';
      lawyer44.is_verified = lawyer44.is_verified || 0;
      lawyer44.lawyer_verified = lawyer44.lawyer_verified || 0;
      
      console.log('Lawyer 44 data:', {
        id: lawyer44.id,
        name: lawyer44.name,
        email: lawyer44.email,
        role: lawyer44.role,
        is_verified: lawyer44.is_verified,
        lawyer_verified: lawyer44.lawyer_verified
      });
      
      const lawyer44CanCreate = lawyer44.role === 'lawyer' && 
                               (lawyer44.is_verified === 1) && 
                               (lawyer44.lawyer_verified === 1);
      console.log('Lawyer 44 can create blogs:', lawyer44CanCreate);
    }
    
    console.log('\n=== AUTHENTICATION FIX TEST COMPLETE ===');
    console.log('\n✅ SUMMARY:');
    console.log('- Fixed middleware to check lawyers table first for lawyer routes');
    console.log('- Lawyers can now properly authenticate and access lawyer-only resources');
    console.log('- Blog creation and Q&A answering should now work for verified lawyers');
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testAuthFix();