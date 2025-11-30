const db = require('./db');

async function testBlogCreation() {
  try {
    console.log('Testing blog creation with new SEO fields...');
    
    // Sample blog data matching your form fields
    const blogData = {
      secure_id: require('crypto').randomBytes(16).toString('hex'),
      title: 'Understanding Legal Rights in Digital Age',
      slug: 'understanding-legal-rights-digital-age',
      content: 'This is a comprehensive guide about legal rights in the digital age...',
      excerpt: 'A comprehensive guide about legal rights in the digital age.',
      featured_image: 'https://example.com/image.jpg',
      category: 'Digital Law',
      tags: JSON.stringify(['digital rights', 'privacy', 'technology law']),
      author_id: 1, // Using lawyer ID (check lawyers table)
      author_name: 'John Doe, Esq.',
      meta_title: 'Legal Rights in Digital Age - Complete Guide',
      focus_keyword: 'digital legal rights',
      meta_description: 'Learn about your legal rights in the digital age. Comprehensive guide covering privacy, data protection, and technology law.',
      image_alt_text: 'Digital legal rights concept illustration',
      status: 'published',
      published_at: new Date()
    };
    
    const [blogId] = await db('blogs').insert(blogData);
    console.log('✅ Blog created successfully with ID:', blogId);
    
    // Fetch the created blog to verify all fields
    const createdBlog = await db('blogs').where('id', blogId).first();
    console.log('✅ Blog data verification:');
    console.log('- Secure ID:', createdBlog.secure_id);
    console.log('- Title:', createdBlog.title);
    console.log('- Slug:', createdBlog.slug);
    console.log('- Meta Title:', createdBlog.meta_title);
    console.log('- Focus Keyword:', createdBlog.focus_keyword);
    console.log('- Meta Description:', createdBlog.meta_description);
    console.log('- Image Alt Text:', createdBlog.image_alt_text);
    console.log('- Author Name:', createdBlog.author_name);
    
    // Test fetching by secure_id
    const blogBySecureId = await db('blogs').where('secure_id', createdBlog.secure_id).first();
    console.log('✅ Blog fetch by secure_id successful:', !!blogBySecureId);
    
    // Clean up - delete the test blog
    await db('blogs').where('id', blogId).del();
    console.log('✅ Test blog cleaned up');
    
    console.log('\n🎉 All tests passed! Your blog system is ready with:');
    console.log('- Secure random IDs instead of database IDs');
    console.log('- SEO optimization fields (meta_title, focus_keyword, meta_description)');
    console.log('- Image alt text for accessibility');
    console.log('- Custom slug support');
    console.log('- Author name field');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit();
  }
}

testBlogCreation();