const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  submitContactForm,
  getAllSubmissions,
  getSubmissionStats,
  updateSubmissionStatus,
  deleteSubmission
} = require('../controllers/contactSubmissionsController');

// Public route
router.post('/submit', submitContactForm);

// Admin routes
router.get('/', authenticate, authorize('manage', 'admin'), getAllSubmissions);
router.get('/stats', authenticate, authorize('manage', 'admin'), getSubmissionStats);
router.put('/:id', authenticate, authorize('manage', 'admin'), updateSubmissionStatus);
router.delete('/:id', authenticate, authorize('manage', 'admin'), deleteSubmission);

module.exports = router;
