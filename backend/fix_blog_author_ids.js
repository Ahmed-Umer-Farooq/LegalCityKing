const db = require('./db');

async function fixBlogAuthorIds() {
  try {
    console.log('Fixing blog author_ids...');
    
    // Get blogs with null author_id
    const blogsWithoutAuthor = await db('blogs').whereNull('author_id');
    console.log(`Found ${blogsWithoutAuthor.length} blogs without author_id`);
    
    // Get first available lawyer as default
    const defaultLawyer = await db('lawyers').first();
    if (!defaultLawyer) {
      console.log('No lawyers found in database');
      return;
    }
    
    console.log(`Using default lawyer: ${defaultLawyer.name} (ID: ${defaultLawyer.id})`);
    
    // Update all blogs without author_id to use the default lawyer
    const updated = await db('blogs')
      .whereNull('author_id')
      .update({ author_id: defaultLawyer.id });
    
    console.log(`✅ Updated ${updated} blogs with author_id: ${defaultLawyer.id}`);
    
    // Verify the fix
    const blogsAfterFix = await db('blogs').select('id', 'title', 'author_id', 'author_name');
    console.log('\nBlogs after fix:');
    blogsAfterFix.forEach(blog => {
      console.log(`- ID: ${blog.id}, Title: ${blog.title}, Author ID: ${blog.author_id}, Author Name: ${blog.author_name}`);
    });
    
  } catch (error) {
    console.error('Error fixing blog author_ids:', error);
  } finally {
    process.exit();
  }
}

fixBlogAuthorIds();