const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { requireAuth, requireLawyer, checkBlogOwnership } = require('../utils/middleware');

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
router.get('/analytics', requireAuth, requireLawyer, blogController.getLawyerBlogAnalytics);

// GET /api/blogs/engagement-count - Get engagement count for notifications
router.get('/engagement-count', requireAuth, requireLawyer, blogController.getEngagementCount);

// GET /api/blogs/categories - Get blog categories
router.get('/categories', blogController.getBlogCategories);

// GET /api/blogs/top-authors - Get top authors
router.get('/top-authors', blogController.getTopAuthors);

// GET /api/blogs/tags - Get blog tags
router.get('/tags', blogController.getBlogTags);

// GET /api/blogs/popular - Get popular posts
router.get('/popular', blogController.getPopularPosts);

// GET /api/blogs/reports/count - Get pending reports count (admin only)
router.get('/reports/count', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.getPendingReportsCount);

// GET /api/blogs/reports - Get all reports (admin only)
router.get('/reports', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, blogController.getAllReports);

// LAWYER ROUTES
// POST /api/blogs - Create new blog (lawyers only)
router.post('/', requireAuth, requireLawyer, upload.single('image'), blogController.createBlog);

// PUT /api/blogs/:id - Update own blog (author only)
router.put('/:identifier', requireAuth, requireLawyer, checkBlogOwnership, blogController.updateBlog);

// DELETE /api/blogs/:id - Delete own blog (author only)
router.delete('/:identifier', requireAuth, requireLawyer, checkBlogOwnership, blogController.deleteBlog);

// GET /api/blogs/:blog_id/analytics - Get detailed analytics for specific blog
router.get('/:blog_id/analytics', requireAuth, requireLawyer, blogController.getBlogDetailedAnalytics);

// DELETE /api/blogs/comments/:comment_id/moderate - Delete comment as blog author
router.delete('/comments/:comment_id/moderate', requireAuth, requireLawyer, blogController.deleteBlogCommentByAuthor);

// PUBLIC ROUTES (no auth required)
// GET /api/blogs - Get all published blogs
router.get('/', blogController.getAllBlogs);



// COMMENT ROUTES
// GET /api/blogs/:blog_id/comments - Get comments for a blog (public)
router.get('/:blog_id/comments', blogController.getBlogComments);

// POST /api/blogs/:blog_id/comments - Create comment (auth required)
router.post('/:blog_id/comments', requireAuth, blogController.createBlogComment);

// DELETE /api/blogs/comments/:comment_id - Delete own comment (auth required)
router.delete('/comments/:comment_id', requireAuth, blogController.deleteBlogComment);

// POST /api/blogs/:blog_id/like - Toggle like (auth required)
router.post('/:blog_id/like', requireAuth, blogController.toggleBlogLike);

// POST /api/blogs/:blog_id/save - Toggle save (auth required)
router.post('/:blog_id/save', requireAuth, blogController.toggleBlogSave);

// PUT /api/blogs/reports/:report_id - Update report status (admin only)
router.put('/reports/:report_id', requireAuth, (req, res, next) => {
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
  // If it's a 32-character hex string, treat as secure_id, otherwise treat as slug
  if (/^[a-f0-9]{32}$/.test(identifier)) {
    blogController.getBlogById(req, res);
  } else {
    blogController.getBlogBySlug(req, res);
  }
});

module.exports = router;