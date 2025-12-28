const express = require('express');
const { authenticateLawyer, authenticateAdmin } = require('../utils/middleware');
const {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  upload
} = require('../controllers/verificationController');

const router = express.Router();

// Lawyer routes
router.post('/submit', authenticateLawyer, upload.array('documents', 5), submitVerification);
router.get('/status', authenticateLawyer, getVerificationStatus);

// Admin routes
router.get('/pending', authenticateAdmin, getPendingVerifications);
router.post('/approve/:lawyerId', authenticateAdmin, approveVerification);
router.post('/reject/:lawyerId', authenticateAdmin, rejectVerification);

module.exports = router;