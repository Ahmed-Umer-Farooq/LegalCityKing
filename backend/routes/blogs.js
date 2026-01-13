const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, authorize, requireVerifiedLawyer } = require('../middleware/modernAuth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// SPECIFIC ROUTES (must be before dynamic routes)
// GET /api/blogs/analytics - Get lawyer's blog analytics (lawyers only)
router.get('/analytics', authenticate, requireVerifiedLawyer, blogController.getLawyerBlogAnalytics);

// GET /api/blogs/lawyer-blogs - Get lawyer's own blogs with secure_id (lawyers only)
router.get('/lawyer-blogs', authenticate, requireVerifiedLawyer, blogController.getLawyerBlogs);

// GET /api/blogs/engagement-count - Get engagement count for notifications
router.get('/engagement-count', authenticate, requireVerifiedLawyer, blogController.getEngagementCount);

// GET /api/blogs/categories - Get blog categories
router.get('/categories', blogController.getBlogCategories);

// GET /api/blogs/top-authors - Get top authors
router.get('/top-authors', blogController.getTopAuthors);

// GET /api/blogs/tags - Get blog tags
router.get('/tags', blogController.getBlogTags);

// GET /api/blogs/popular - Get popular posts
router.get('/popular', blogController.getPopularPosts);

// GET /api/blogs/reports/count - Get pending reports count (admin only)
router.get('/reports/count', authenticate, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.getPendingReportsCount);

// GET /api/blogs/reports - Get all reports (admin only)
router.get('/reports', authenticate, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.getAllReports);

// DELETE /api/blogs/admin/:id - Admin delete any blog
router.delete('/admin/:id', authenticate, (req, res, next) => {
  if (req.user.role !== 'admin' && !req.user.is_admin && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.adminDeleteBlog);

// LAWYER ROUTES
// POST /api/blogs - Create new blog (lawyers only)
router.post('/', authenticate, requireVerifiedLawyer, upload.single('image'), blogController.createBlog);

// PUT /api/blogs/:id - Update own blog (author only)
router.put('/:identifier', authenticate, requireVerifiedLawyer, blogController.updateBlog);

// DELETE /api/blogs/:id - Delete own blog (author only)
router.delete('/:identifier', authenticate, requireVerifiedLawyer, blogController.deleteBlog);

// GET /api/blogs/:blog_id/analytics - Get detailed analytics for specific blog
router.get('/:blog_id/analytics', authenticate, requireVerifiedLawyer, blogController.getBlogDetailedAnalytics);

// DELETE /api/blogs/comments/:comment_id/moderate - Delete comment as blog author
router.delete('/comments/:comment_id/moderate', authenticate, requireVerifiedLawyer, blogController.deleteBlogCommentByAuthor);

// PUBLIC ROUTES (no auth required)
// GET /api/blogs - Get all published blogs
router.get('/', blogController.getAllBlogs);



// COMMENT ROUTES
// COMMENT ROUTES
// GET /api/blogs/:blog_id/comments - Get comments for a blog (public)
router.get('/:blog_id/comments', blogController.getBlogComments);

// POST /api/blogs/:blog_id/comments - Create comment (auth required)
router.post('/:blog_id/comments', authenticate, blogController.createBlogComment);

// DELETE /api/blogs/comments/:comment_id - Delete own comment (auth required)
router.delete('/comments/:comment_id', authenticate, blogController.deleteBlogComment);

// POST /api/blogs/:blog_id/like - Toggle like (auth required)
router.post('/:blog_id/like', authenticate, blogController.toggleBlogLike);

// GET /api/blogs/:blog_id/like-status - Check like status (auth required)
router.get('/:blog_id/like-status', authenticate, blogController.checkLikeStatus);

// POST /api/blogs/:blog_id/save - Toggle save (auth required)
router.post('/:blog_id/save', authenticate, blogController.toggleBlogSave);

// GET /api/blogs/:blog_id/save-status - Check save status (auth required)
router.get('/:blog_id/save-status', authenticate, blogController.checkSaveStatus);

// PUT /api/blogs/reports/:report_id - Update report status (admin only)
router.put('/reports/:report_id', authenticate, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.updateReportStatus);

// REPORT ROUTES
// POST /api/blogs/:blog_id/report - Report blog (public - no auth required)
router.post('/:blog_id/report', (req, res, next) => {
  // Optional auth - attach user if token exists
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'null' && token !== 'undefined') {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Continue without user if token is invalid
        console.log('Invalid token for report, continuing as anonymous');
      }
    }
  }
  next();
}, blogController.reportBlog);

// GET /api/blogs/:identifier - Get single blog by slug or secure_id (must be last)
router.get('/:identifier', (req, res) => {
  const { identifier } = req.params;
  // Always try slug first for SEO-friendly URLs, fallback to secure_id
  blogController.getBlogBySlug(req, res);
});

module.exports = router;
