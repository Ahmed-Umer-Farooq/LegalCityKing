const db = require('./db');

async function fixAuthorNames() {
  try {
    console.log('=== FIXING AUTHOR NAMES IN BLOGS ===\n');
    
    // Get blogs with null author_name
    const blogsWithoutAuthorName = await db('blogs')
      .select('id', 'title', 'author_id', 'author_name')
      .whereNull('author_name');
    
    console.log('Found', blogsWithoutAuthorName.length, 'blogs without author_name');
    
    for (const blog of blogsWithoutAuthorName) {
      // Try to find author in lawyers table first
      let author = await db('lawyers').where('id', blog.author_id).first();
      if (author) {
        await db('blogs').where('id', blog.id).update({ author_name: author.name });
        console.log(`✅ Updated blog "${blog.title}" with lawyer author: ${author.name}`);
        continue;
      }
      
      // Try users table
      author = await db('users').where('id', blog.author_id).first();
      if (author) {
        await db('blogs').where('id', blog.id).update({ author_name: author.name });
        console.log(`✅ Updated blog "${blog.title}" with user author: ${author.name}`);
        continue;
      }
      
      console.log(`⚠️  Could not find author for blog "${blog.title}" (author_id: ${blog.author_id})`);
    }
    
    console.log('\n=== AUTHOR NAME FIX COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
}

fixAuthorNames();