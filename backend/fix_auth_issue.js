const db = require('./db');

async function fixAuthIssue() {
  try {
    console.log('=== FIXING AUTHENTICATION ISSUE ===\n');
    
    // Step 1: Identify duplicate IDs
    console.log('1. CHECKING FOR DUPLICATE IDs:');
    const userIds = await db('users').select('id', 'name', 'email', 'role');
    const lawyerIds = await db('lawyers').select('id', 'name', 'email');
    
    const duplicateIds = [];
    userIds.forEach(user => {
      const lawyer = lawyerIds.find(l => l.id === user.id);
      if (lawyer) {
        duplicateIds.push({
          id: user.id,
          user: { name: user.name, email: user.email, role: user.role },
          lawyer: { name: lawyer.name, email: lawyer.email }
        });
      }
    });
    
    console.log('Duplicate IDs found:', duplicateIds.length);
    duplicateIds.forEach(dup => {
      console.log(`ID ${dup.id}:`);
      console.log(`  Users table: ${dup.user.name} (${dup.user.email}) - Role: ${dup.user.role}`);
      console.log(`  Lawyers table: ${dup.lawyer.name} (${dup.lawyer.email})`);
    });
    
    // Step 2: Fix the middleware logic by updating it to handle this properly
    console.log('\n2. RECOMMENDED FIXES:');
    console.log('Option 1: Update middleware to check lawyers table first for lawyer authentication');
    console.log('Option 2: Migrate lawyers to use unique IDs starting from max(users.id) + 1');
    console.log('Option 3: Add a table prefix or namespace to distinguish user types');
    
    // Step 3: Check current blog authors
    console.log('\n3. CHECKING BLOG AUTHORS:');
    const blogs = await db('blogs').select('id', 'title', 'author_id', 'author_name');
    const blogAuthors = {};
    blogs.forEach(blog => {
      if (!blogAuthors[blog.author_id]) {
        blogAuthors[blog.author_id] = [];
      }
      blogAuthors[blog.author_id].push(blog.title);
    });
    
    console.log('Blog authors by ID:');
    for (const [authorId, titles] of Object.entries(blogAuthors)) {
      const user = userIds.find(u => u.id == authorId);
      const lawyer = lawyerIds.find(l => l.id == authorId);
      console.log(`Author ID ${authorId}:`);
      if (user) console.log(`  Users table: ${user.name} (${user.role})`);
      if (lawyer) console.log(`  Lawyers table: ${lawyer.name}`);
      console.log(`  Blogs: ${titles.length} blogs`);
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
}

fixAuthIssue();