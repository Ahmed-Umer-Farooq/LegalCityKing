const db = require('../db');
const crypto = require('crypto');

const blogController = {
  // Get all published blogs (public endpoint)
  getAllBlogs: async (req, res) => {
    try {
      const { page = 1, limit = 100, category, search } = req.query;
      const offset = (page - 1) * limit;

      let query = db('blogs');
      
      if (category) query = query.where('category', category);
      if (search) query = query.where('title', 'like', `%${search}%`);

      const blogs = await query
        .select(
          'id',
          'secure_id',
          'title',
          'slug',
          'excerpt',
          'featured_image',
          'category',
          'views_count',
          'published_at',
          'author_name',
          'meta_title',
          'focus_keyword',
          'meta_description',
          'image_alt_text'
        )
        .orderBy('published_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Add counts separately
      const blogsWithCounts = await Promise.all(blogs.map(async (blog) => {
        const [commentCount, likeCount] = await Promise.all([
          db('blog_comments').where('blog_id', blog.id).count('* as count').first(),
          db('blog_likes').where('blog_id', blog.id).count('* as count').first()
        ]);
        return {
          secure_id: blog.secure_id,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          featured_image: blog.featured_image,
          category: blog.category,
          views_count: blog.views_count,
          published_at: blog.published_at,
          author_name: blog.author_name,
          meta_title: blog.meta_title,
          focus_keyword: blog.focus_keyword,
          meta_description: blog.meta_description,
          image_alt_text: blog.image_alt_text,
          comment_count: commentCount.count,
          like_count: likeCount.count
        };
      }));

      res.json(blogsWithCounts);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  },

  // Get single blog by slug or secure_id
  getBlogBySlug: async (req, res) => {
    try {
      const { identifier } = req.params;
      
      const blog = await db('blogs')
        .select(
          'blogs.secure_id',
          'blogs.title',
          'blogs.slug',
          'blogs.content',
          'blogs.excerpt',
          'blogs.featured_image',
          'blogs.category',
          'blogs.tags',
          'blogs.views_count',
          'blogs.published_at',
          'blogs.created_at',
          'blogs.updated_at',
          'blogs.author_name',
          'blogs.meta_title',
          'blogs.focus_keyword',
          'blogs.meta_description',
          'blogs.image_alt_text',
          'blogs.status'
        )
        .where(function() {
          this.where({ 'blogs.slug': identifier, 'blogs.status': 'published' })
              .orWhere({ 'blogs.secure_id': identifier, 'blogs.status': 'published' });
        })
        .first();

      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Increment view count
      await db('blogs').where('secure_id', blog.secure_id).increment('views_count', 1);

      res.json(blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Failed to fetch blog' });
    }
  },

  // Get single blog by secure_id (check ownership for unpublished)
  getBlogById: async (req, res) => {
    try {
      const { identifier } = req.params;
      
      const blog = await db('blogs')
        .select('blogs.*')
        .where('blogs.secure_id', identifier)
        .first();

      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Only show published blogs to public, or own blogs to author/admin
      if (blog.status !== 'published') {
        if (!req.user || (req.user.id !== blog.author_id && req.user.role !== 'admin')) {
          return res.status(404).json({ message: 'Blog not found' });
        }
      }

      // Increment view count for published blogs
      if (blog.status === 'published') {
        await db('blogs').where('id', blog.id).increment('views_count', 1);
      }

      res.json(blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Failed to fetch blog' });
    }
  },

  // Get blog categories with counts
  getBlogCategories: async (req, res) => {
    try {
      const categories = await db('blogs')
        .select('category as name')
        .count('* as count')
        .where('status', 'published')
        .whereNotNull('category')
        .groupBy('category')
        .orderBy('count', 'desc');

      res.json(categories);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Failed to fetch blog categories' });
    }
  },

  // Get top authors with post counts
  getTopAuthors: async (req, res) => {
    try {
      const authors = await db('lawyers')
        .select(
          'lawyers.name',
          'lawyers.email',
          'lawyers.profile_image'
        )
        .count('blogs.id as post_count')
        .innerJoin('blogs', 'lawyers.id', 'blogs.author_id')
        .where('blogs.status', 'published')
        .groupBy('lawyers.name', 'lawyers.email', 'lawyers.profile_image')
        .orderBy('post_count', 'desc')
        .limit(3);

      res.json(authors);
    } catch (error) {
      console.error('Error fetching top authors:', error);
      res.status(500).json({ message: 'Failed to fetch top authors' });
    }
  },

  // Get blog tags (simplified)
  getBlogTags: async (req, res) => {
    try {
      const blogs = await db('blogs')
        .select('tags')
        .where('status', 'published')
        .whereNotNull('tags');

      const tagCounts = {};
      blogs.forEach(blog => {
        if (blog.tags) {
          try {
            const tags = JSON.parse(blog.tags);
            if (Array.isArray(tags)) {
              tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });

      const tags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      res.json(tags);
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      res.status(500).json({ message: 'Failed to fetch blog tags' });
    }
  },

  // Get popular posts by views
  getPopularPosts: async (req, res) => {
    try {
      const posts = await db('blogs')
        .select(
          'secure_id',
          'title',
          'slug',
          'excerpt',
          'featured_image',
          'category',
          'views_count',
          'published_at',
          'author_name',
          'meta_title',
          'focus_keyword',
          'meta_description',
          'image_alt_text'
        )
        .where('status', 'published')
        .orderBy('views_count', 'desc')
        .limit(3);

      res.json(posts);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
      res.status(500).json({ message: 'Failed to fetch popular posts' });
    }
  },

  // Create new blog (lawyers only)
  createBlog: async (req, res) => {
    try {
      const { 
        title, 
        content, 
        category, 
        excerpt, 
        imageUrl, 
        tags, 
        author_name,
        slug: customSlug,
        meta_title,
        focus_keyword,
        meta_description,
        image_alt_text
      } = req.body;
      
      // Handle image - either uploaded file or URL
      let featured_image = '';
      if (req.file) {
        featured_image = `/uploads/${req.file.filename}`;
      } else if (imageUrl) {
        featured_image = imageUrl;
      }
      
      // Validation
      if (!title || !content || !category || !author_name) {
        return res.status(400).json({ message: 'Title, content, category, and author name are required' });
      }

      // Generate secure random ID
      const secure_id = crypto.randomBytes(16).toString('hex');
      
      // Generate slug from title or use custom slug
      const slug = customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Generate excerpt if not provided
      const blogExcerpt = excerpt || content.substring(0, 200) + '...';
      
      // Generate meta_title if not provided (use title, truncated to 60 chars)
      const metaTitle = meta_title || title.substring(0, 60);
      
      // Generate meta_description if not provided (use excerpt, truncated to 160 chars)
      const metaDescription = meta_description || blogExcerpt.substring(0, 160);
      
      const [blogId] = await db('blogs').insert({
        secure_id,
        title,
        slug,
        content,
        excerpt: blogExcerpt,
        featured_image,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        author_id: req.user.id,
        author_name: author_name,
        meta_title: metaTitle,
        focus_keyword: focus_keyword || null,
        meta_description: metaDescription,
        image_alt_text: image_alt_text || null,
        status: 'published',
        published_at: new Date()
      });

      const newBlog = await db('blogs').where('id', blogId).first();
      res.status(201).json(newBlog);
    } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({ message: 'Failed to create blog' });
    }
  },

  // Update own blog (author only)
  updateBlog: async (req, res) => {
    try {
      const { identifier } = req.params;
      const { 
        title, 
        content, 
        category, 
        excerpt, 
        featured_image, 
        tags, 
        status,
        slug: customSlug,
        meta_title,
        focus_keyword,
        meta_description,
        image_alt_text
      } = req.body;
      
      const updateData = {
        updated_at: new Date()
      };
      
      if (title) {
        updateData.title = title;
        updateData.slug = customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (content) updateData.content = content;
      if (category) updateData.category = category;
      if (excerpt) updateData.excerpt = excerpt;
      if (featured_image) updateData.featured_image = featured_image;
      if (tags) updateData.tags = JSON.stringify(tags);
      if (status && ['draft', 'pending'].includes(status)) updateData.status = status;
      if (meta_title) updateData.meta_title = meta_title;
      if (focus_keyword) updateData.focus_keyword = focus_keyword;
      if (meta_description) updateData.meta_description = meta_description;
      if (image_alt_text) updateData.image_alt_text = image_alt_text;

      const updated = await db('blogs').where('secure_id', identifier).update(updateData);
      
      if (!updated) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const updatedBlog = await db('blogs').where('secure_id', identifier).first();
      res.json(updatedBlog);
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ message: 'Failed to update blog' });
    }
  },

  // Delete own blog (author only)
  deleteBlog: async (req, res) => {
    try {
      const { identifier } = req.params;
      
      const deleted = await db('blogs').where('secure_id', identifier).del();
      
      if (!deleted) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).json({ message: 'Failed to delete blog' });
    }
  },

  // Get lawyer's own blogs (all statuses)
  getLawyerBlogs: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;
      
      let query = db('blogs')
        .select(
          'blogs.secure_id', 
          'blogs.title', 
          'blogs.slug', 
          'blogs.excerpt', 
          'blogs.category', 
          'blogs.status', 
          'blogs.views_count', 
          'blogs.created_at', 
          'blogs.updated_at',
          'blogs.author_name',
          'blogs.meta_title',
          'blogs.focus_keyword',
          'blogs.meta_description',
          'blogs.image_alt_text'
        )
        .where('blogs.author_id', req.user.id);
      
      if (status) query = query.where('blogs.status', status);
      
      const blogs = await query.orderBy('blogs.updated_at', 'desc').limit(limit).offset(offset);
      const total = await db('blogs').where('author_id', req.user.id).count('id as count').first();
      
      res.json({
        blogs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
      });
    } catch (error) {
      console.error('Error fetching lawyer blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  },

  // Get comments for a blog (public)
  getBlogComments: async (req, res) => {
    try {
      const { blog_id } = req.params;
      
      // First get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id); // fallback for internal ID
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      
      const comments = await db('blog_comments')
        .select(
          'blog_comments.id',
          'blog_comments.comment_text',
          'blog_comments.created_at',
          'blog_comments.parent_comment_id',
          'users.name as user_name',
          'users.role as user_role'
        )
        .leftJoin('users', 'blog_comments.user_id', 'users.id')
        .where('blog_comments.blog_id', blog.id)
        .orderBy('blog_comments.created_at', 'asc');

      res.json(comments);
    } catch (error) {
      console.error('Error fetching blog comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  },

  // Create comment (auth required)
  createBlogComment: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const { comment_text, parent_comment_id } = req.body;
      
      console.log('Creating comment:', { blog_id, comment_text, parent_comment_id, user: req.user });
      
      if (!comment_text || comment_text.trim().length === 0) {
        return res.status(400).json({ message: 'Comment text is required' });
      }

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      console.log('Found blog:', blog);
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // For lawyers, we need to handle the user_id differently since they're in lawyers table
      let actualUserId = req.user.id;
      
      // If user is a lawyer, we need to find or create a corresponding user record
      if (req.user.role === 'lawyer') {
        // Check if there's already a user record for this lawyer
        let userRecord = await db('users').where('email', req.user.email).first();
        
        if (!userRecord) {
          // Create a user record for the lawyer
          const [newUserId] = await db('users').insert({
            name: req.user.name,
            email: req.user.email,
            role: 'lawyer',
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          actualUserId = newUserId;
        } else {
          actualUserId = userRecord.id;
        }
      }
      
      const insertData = {
        blog_id: blog.id,
        user_id: actualUserId,
        comment_text: comment_text.trim(),
        parent_comment_id: parent_comment_id || null
      };
      
      console.log('Inserting comment data:', insertData);
      
      const [commentId] = await db('blog_comments').insert(insertData);
      
      console.log('Created comment with ID:', commentId);

      // Get user name
      let userName = 'Unknown User';
      let userRole = 'user';
      
      if (req.user.role === 'lawyer') {
        const lawyer = await db('lawyers').select('name').where('id', req.user.id).first();
        userName = lawyer?.name || 'Unknown Lawyer';
        userRole = 'lawyer';
      } else {
        const user = await db('users').select('name', 'role').where('id', req.user.id).first();
        userName = user?.name || 'Unknown User';
        userRole = user?.role || 'user';
      }
      
      const response = {
        id: commentId,
        comment_text: comment_text.trim(),
        created_at: new Date(),
        parent_comment_id: parent_comment_id || null,
        user_name: userName,
        user_role: userRole
      };
      
      console.log('Sending response:', response);

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating blog comment:', error);
      res.status(500).json({ message: 'Failed to create comment', error: error.message });
    }
  },

  // Delete own comment (auth required)
  deleteBlogComment: async (req, res) => {
    try {
      const { comment_id } = req.params;
      
      const comment = await db('blog_comments').where('id', comment_id).first();
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Only allow user to delete their own comment or admin
      if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You can only delete your own comments' });
      }

      await db('blog_comments').where('id', comment_id).del();
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  },

  // Like/Unlike blog (auth required)
  toggleBlogLike: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const userId = req.user.id;

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Check if user already liked this blog
      const existingLike = await db('blog_likes')
        .where({ blog_id: blog.id, user_id: userId })
        .first();

      if (existingLike) {
        // Unlike
        await db('blog_likes').where({ blog_id: blog.id, user_id: userId }).del();
        res.json({ liked: false, message: 'Blog unliked' });
      } else {
        // Like
        await db('blog_likes').insert({ blog_id: blog.id, user_id: userId });
        res.json({ liked: true, message: 'Blog liked' });
      }
    } catch (error) {
      console.error('Error toggling blog like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  },

  // Check like status (auth required)
  checkLikeStatus: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const userId = req.user.id;

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const existingLike = await db('blog_likes')
        .where({ blog_id: blog.id, user_id: userId })
        .first();

      res.json({ liked: !!existingLike });
    } catch (error) {
      console.error('Error checking like status:', error);
      res.status(500).json({ message: 'Failed to check like status' });
    }
  },

  // Save/Unsave blog (auth required)
  toggleBlogSave: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const userId = req.user.id;

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Check if user already saved this blog
      const existingSave = await db('blog_saves')
        .where({ blog_id: blog.id, user_id: userId })
        .first();

      if (existingSave) {
        // Unsave
        await db('blog_saves').where({ blog_id: blog.id, user_id: userId }).del();
        res.json({ saved: false, message: 'Blog removed from saved' });
      } else {
        // Save
        await db('blog_saves').insert({ blog_id: blog.id, user_id: userId });
        res.json({ saved: true, message: 'Blog saved' });
      }
    } catch (error) {
      console.error('Error toggling blog save:', error);
      res.status(500).json({ message: 'Failed to toggle save' });
    }
  },

  // Check save status (auth required)
  checkSaveStatus: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const userId = req.user.id;

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const existingSave = await db('blog_saves')
        .where({ blog_id: blog.id, user_id: userId })
        .first();

      res.json({ saved: !!existingSave });
    } catch (error) {
      console.error('Error checking save status:', error);
      res.status(500).json({ message: 'Failed to check save status' });
    }
  },

  // Get lawyer's blog analytics
  getLawyerBlogAnalytics: async (req, res) => {
    try {
      const lawyerId = req.user.id;
      
      // Get blogs with analytics
      const blogs = await db('blogs')
        .select(
          'blogs.secure_id',
          'blogs.title',
          'blogs.featured_image',
          'blogs.status',
          'blogs.created_at',
          'blogs.views_count'
        )
        .count('blog_comments.id as comment_count')
        .count('blog_likes.id as like_count')
        .count('blog_saves.id as save_count')
        .leftJoin('blog_comments', 'blogs.id', 'blog_comments.blog_id')
        .leftJoin('blog_likes', 'blogs.id', 'blog_likes.blog_id')
        .leftJoin('blog_saves', 'blogs.id', 'blog_saves.blog_id')
        .where('blogs.author_id', lawyerId)
        .groupBy('blogs.id')
        .orderBy('blogs.created_at', 'desc');

      res.json({ success: true, data: blogs });
    } catch (error) {
      console.error('Error fetching blog analytics:', error);
      res.status(500).json({ message: 'Failed to fetch blog analytics' });
    }
  },

  // Get detailed analytics for a specific blog
  getBlogDetailedAnalytics: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const lawyerId = req.user.id;
      
      // Verify blog ownership - check by secure_id first, then fallback to id
      let blog = await db('blogs').where({ secure_id: blog_id, author_id: lawyerId }).first();
      if (!blog) {
        blog = await db('blogs').where({ id: blog_id, author_id: lawyerId }).first();
      }
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found or access denied' });
      }

      // Get engagement metrics
      const metrics = await db('blogs')
        .select(
          'blogs.secure_id',
          'blogs.title',
          'blogs.views_count',
          'blogs.created_at'
        )
        .count('blog_comments.id as comment_count')
        .count('blog_likes.id as like_count')
        .count('blog_saves.id as save_count')
        .leftJoin('blog_comments', 'blogs.id', 'blog_comments.blog_id')
        .leftJoin('blog_likes', 'blogs.id', 'blog_likes.blog_id')
        .leftJoin('blog_saves', 'blogs.id', 'blog_saves.blog_id')
        .where('blogs.id', blog.id)
        .groupBy('blogs.id')
        .first();

      // Get comments with user details
      const comments = await db('blog_comments')
        .select(
          'blog_comments.*',
          'users.name as user_name',
          'users.role as user_role'
        )
        .leftJoin('users', 'blog_comments.user_id', 'users.id')
        .where('blog_comments.blog_id', blog.id)
        .orderBy('blog_comments.created_at', 'desc');

      // Get users who liked the blog
      const likes = await db('blog_likes')
        .select('users.name', 'users.id', 'blog_likes.created_at')
        .leftJoin('users', 'blog_likes.user_id', 'users.id')
        .where('blog_likes.blog_id', blog.id)
        .orderBy('blog_likes.created_at', 'desc');

      // Get users who saved the blog
      const saves = await db('blog_saves')
        .select('users.name', 'users.id', 'blog_saves.created_at')
        .leftJoin('users', 'blog_saves.user_id', 'users.id')
        .where('blog_saves.blog_id', blog.id)
        .orderBy('blog_saves.created_at', 'desc');

      res.json({
        success: true,
        data: {
          metrics,
          comments,
          likes,
          saves
        }
      });
    } catch (error) {
      console.error('Error fetching detailed blog analytics:', error);
      res.status(500).json({ message: 'Failed to fetch detailed analytics' });
    }
  },

  // Delete comment (blog author can delete any comment on their blog)
  deleteBlogCommentByAuthor: async (req, res) => {
    try {
      const { comment_id } = req.params;
      const lawyerId = req.user.id;
      
      // Get comment and verify blog ownership
      const comment = await db('blog_comments')
        .select('blog_comments.*', 'blogs.author_id')
        .leftJoin('blogs', 'blog_comments.blog_id', 'blogs.id')
        .where('blog_comments.id', comment_id)
        .first();

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Allow deletion if user is comment author, blog author, or admin
      if (comment.user_id !== lawyerId && comment.author_id !== lawyerId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      await db('blog_comments').where('id', comment_id).del();
      res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  },

  // Get engagement count for notification badge
  getEngagementCount: async (req, res) => {
    try {
      const lawyerId = req.user.id;
      
      // Get total new engagements (comments, likes, saves) from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const [commentCount, likeCount, saveCount] = await Promise.all([
        db('blog_comments')
          .join('blogs', 'blog_comments.blog_id', 'blogs.id')
          .where('blogs.author_id', lawyerId)
          .where('blog_comments.created_at', '>', weekAgo)
          .count('* as count')
          .first(),
        db('blog_likes')
          .join('blogs', 'blog_likes.blog_id', 'blogs.id')
          .where('blogs.author_id', lawyerId)
          .where('blog_likes.created_at', '>', weekAgo)
          .count('* as count')
          .first(),
        db('blog_saves')
          .join('blogs', 'blog_saves.blog_id', 'blogs.id')
          .where('blogs.author_id', lawyerId)
          .where('blog_saves.created_at', '>', weekAgo)
          .count('* as count')
          .first()
      ]);

      const totalCount = (commentCount?.count || 0) + (likeCount?.count || 0) + (saveCount?.count || 0);
      
      res.json({ success: true, count: totalCount });
    } catch (error) {
      console.error('Error fetching engagement count:', error);
      res.status(500).json({ message: 'Failed to fetch engagement count' });
    }
  },

  // Report blog (public endpoint - no auth required)
  reportBlog: async (req, res) => {
    try {
      const { blog_id } = req.params;
      const { reason, description, reporter_email } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
      }

      // Get the internal blog ID from secure_id or slug
      const blog = await db('blogs')
        .select('id', 'title')
        .where(function() {
          this.where('secure_id', blog_id)
              .orWhere('slug', blog_id)
              .orWhere('id', blog_id);
        })
        .first();
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const reportData = {
        blog_id: blog.id,
        reason,
        description: description || null,
        status: 'pending'
      };

      // Add user_id if authenticated, otherwise use email
      if (req.user) {
        reportData.user_id = req.user.id;
      } else {
        if (!reporter_email) {
          return res.status(400).json({ message: 'Email is required for anonymous reports' });
        }
        reportData.reporter_email = reporter_email;
      }

      await db('blog_reports').insert(reportData);
      
      // Log activity
      try {
        await db('activity_logs').insert({
          event: 'Blog Reported',
          user: req.user ? req.user.name : (reporter_email || 'Anonymous'),
          details: `Blog "${blog.title}" reported for: ${reason}`,
          type: 'report_activity',
          status: 'success',
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Error logging report activity:', logError);
      }
      
      res.json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
      console.error('Error reporting blog:', error);
      res.status(500).json({ message: 'Failed to submit report' });
    }
  },

  // Get all reports (admin only)
  getAllReports: async (req, res) => {
    try {
      const { status = 'pending' } = req.query;
      
      const reports = await db('blog_reports')
        .select(
          'blog_reports.*',
          'blogs.title as blog_title',
          'blogs.author_name',
          'users.name as reporter_name',
          'admin_users.name as reviewed_by_name'
        )
        .leftJoin('blogs', 'blog_reports.blog_id', 'blogs.id')
        .leftJoin('users', 'blog_reports.user_id', 'users.id')
        .leftJoin('users as admin_users', 'blog_reports.reviewed_by', 'admin_users.id')
        .where('blog_reports.status', status)
        .orderBy('blog_reports.created_at', 'desc');

      res.json({ success: true, data: reports });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  },

  // Update report status (admin only)
  updateReportStatus: async (req, res) => {
    try {
      const { report_id } = req.params;
      const { status, admin_notes } = req.body;
      
      if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Get report details for logging
      const report = await db('blog_reports')
        .select('blog_reports.*', 'blogs.title as blog_title')
        .leftJoin('blogs', 'blog_reports.blog_id', 'blogs.id')
        .where('blog_reports.id', report_id)
        .first();
      
      await db('blog_reports')
        .where('id', report_id)
        .update({
          status,
          admin_notes: admin_notes || null,
          reviewed_by: req.user.id,
          updated_at: new Date()
        });

      // Log activity
      try {
        await db('activity_logs').insert({
          event: `Report ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          user: req.user.name,
          details: `Report for blog "${report?.blog_title || 'Unknown'}" marked as ${status}`,
          type: 'report_activity',
          status: 'success',
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Error logging report status update:', logError);
      }

      res.json({ success: true, message: 'Report status updated' });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ message: 'Failed to update report status' });
    }
  },

  // Get pending reports count (admin only)
  getPendingReportsCount: async (req, res) => {
    try {
      const count = await db('blog_reports')
        .where('status', 'pending')
        .count('id as count')
        .first();

      res.json({ success: true, count: count.count || 0 });
    } catch (error) {
      console.error('Error fetching pending reports count:', error);
      res.status(500).json({ message: 'Failed to fetch reports count' });
    }
  }
};

module.exports = blogController;