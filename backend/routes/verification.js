const express = require('express');
const { authenticateToken, authenticateAdmin } = require('../utils/middleware');
const {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  upload
} = require('../controllers/verificationController');

const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (err.message.includes('Only PDF, JPG, JPEG, and PNG files are allowed')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'File upload error' });
  }
  next();
};

// Lawyer routes
router.post('/submit', authenticateToken, upload.array('documents', 5), handleMulterError, submitVerification);
router.get('/status', authenticateToken, getVerificationStatus);

// Admin routes
router.get('/pending', authenticateAdmin, getPendingVerifications);
router.post('/approve/:lawyerId', authenticateAdmin, approveVerification);
router.post('/reject/:lawyerId', authenticateAdmin, rejectVerification);

module.exports = router;