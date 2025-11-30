const db = require('./db');

async function transferBlogsToLawyer() {
  try {
    console.log('Transferring all blogs to lawyer ID 9 (Ghazi)...');
    
    // Update all blogs to be owned by lawyer ID 9
    const updated = await db('blogs').update({ 
      author_id: 9,
      author_name: 'Ghazi'
    });
    
    console.log(`✅ Transferred ${updated} blogs to lawyer ID 9`);
    
    // Verify the transfer
    const blogs = await db('blogs').select('id', 'title', 'author_id', 'author_name');
    console.log('\nAll blogs now owned by:');
    blogs.forEach(blog => {
      console.log(`- ${blog.title} (Author: ${blog.author_name}, ID: ${blog.author_id})`);
    });
    
  } catch (error) {
    console.error('Error transferring blogs:', error);
  } finally {
    process.exit();
  }
}

transferBlogsToLawyer();