const express = require('express');
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  getAllLawyers,
  approveVerification,
  rejectVerification,
  updateRestrictions,
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
router.post('/submit', authenticate, upload.array('documents', 5), handleMulterError, submitVerification);
router.get('/status', authenticate, getVerificationStatus);

// Admin routes
router.get('/pending', authenticate, getPendingVerifications);
router.get('/all-lawyers', authenticate, getAllLawyers);
router.post('/approve/:lawyerId', authenticate, approveVerification);
router.post('/reject/:lawyerId', authenticate, rejectVerification);
router.post('/update-restrictions/:lawyerId', authenticate, updateRestrictions);

module.exports = router;
