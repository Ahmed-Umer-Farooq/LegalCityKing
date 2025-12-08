const express = require('express');
const { createReview, getReviews, createEndorsement, getEndorsements } = require('../controllers/reviewController');
const { authenticateToken } = require('../utils/middleware');

const router = express.Router();

router.post('/reviews', authenticateToken, createReview);
router.get('/reviews/:lawyer_secure_id', getReviews);
router.post('/endorsements', authenticateToken, createEndorsement);
router.get('/endorsements/:lawyer_secure_id', getEndorsements);

module.exports = router;
