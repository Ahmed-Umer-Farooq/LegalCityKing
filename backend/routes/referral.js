const express = require('express');
const router = express.Router();
const { getReferralData } = require('../controllers/referralController');
const { authenticateToken } = require('../utils/middleware');

// Get referral data
router.get('/data', authenticateToken, getReferralData);

module.exports = router;