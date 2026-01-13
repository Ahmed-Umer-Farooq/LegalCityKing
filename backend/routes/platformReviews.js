const express = require('express');
const router = express.Router();
const platformReviewController = require('../controllers/platformReviewController');
const { authenticate, authorize } = require('../middleware/modernAuth');

// Public routes
router.get('/featured', platformReviewController.getFeaturedReviews);
router.get('/approved', platformReviewController.getApprovedReviews);

// Protected routes
router.get('/', authenticate, platformReviewController.getAllReviews);
router.post('/', authenticate, platformReviewController.createReview);
router.put('/:id/status', authenticate, authorize('manage', 'admin'), platformReviewController.updateReviewStatus);

module.exports = router;
