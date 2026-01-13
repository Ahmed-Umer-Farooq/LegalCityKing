const express = require('express');
const router = express.Router();
const { getReferralData } = require('../controllers/referralController');
const { authenticate } = require('../middleware/modernAuth');

// Get referral data
router.get('/data', authenticate, getReferralData);

module.exports = router;
