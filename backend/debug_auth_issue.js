const db = require('./db');

async function debugAuthIssue() {
  try {
    console.log('=== DEBUGGING AUTHENTICATION ISSUE ===\n');
    
    // Check lawyers table structure and data
    console.log('1. LAWYERS TABLE STRUCTURE:');
    const lawyersColumns = await db.raw("DESCRIBE lawyers");
    console.log('Columns:', lawyersColumns[0].map(col => `${col.Field} (${col.Type})`).join(', '));
    
    console.log('\n2. LAWYERS DATA:');
    const lawyers = await db('lawyers')
      .select('id', 'name', 'email', 'is_verified', 'lawyer_verified', 'secure_id')
      .limit(3);
    console.log('Sample lawyers:', JSON.stringify(lawyers, null, 2));
    
    // Check users table structure and data
    console.log('\n3. USERS TABLE STRUCTURE:');
    const usersColumns = await db.raw("DESCRIBE users");
    console.log('Columns:', usersColumns[0].map(col => `${col.Field} (${col.Type})`).join(', '));
    
    console.log('\n4. USERS DATA:');
    const users = await db('users')
      .select('id', 'name', 'email', 'role', 'is_verified', 'secure_id')
      .limit(3);
    console.log('Sample users:', JSON.stringify(users, null, 2));
    
    // Check blogs table
    console.log('\n5. BLOGS TABLE:');
    const blogs = await db('blogs')
      .select('id', 'title', 'author_id', 'secure_id', 'status', 'author_name')
      .limit(3);
    console.log('Sample blogs:', JSON.stringify(blogs, null, 2));
    
    // Check QA questions table
    console.log('\n6. QA QUESTIONS TABLE:');
    const questions = await db('qa_questions')
      .select('id', 'question', 'status', 'user_id')
      .limit(3);
    console.log('Sample questions:', JSON.stringify(questions, null, 2));
    
    // Test authentication middleware logic
    console.log('\n7. TESTING AUTHENTICATION LOGIC:');
    
    // Simulate a lawyer user
    const testLawyer = lawyers[0];
    if (testLawyer) {
      console.log('Testing lawyer authentication for:', testLawyer.email);
      console.log('Is verified:', testLawyer.is_verified);
      console.log('Lawyer verified:', testLawyer.lawyer_verified);
      
      // Check if this lawyer can create blogs based on middleware logic
      // Note: lawyers table doesn't have 'role' column, role is set in middleware
      const canCreateBlogs = (testLawyer.is_verified === 1 || testLawyer.is_verified === true) && 
                           (testLawyer.lawyer_verified === 1 || testLawyer.lawyer_verified === true);
      console.log('Can create blogs (verification check):', canCreateBlogs);
      console.log('Note: Role is set to "lawyer" in middleware for lawyers table users');
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugAuthIssue();