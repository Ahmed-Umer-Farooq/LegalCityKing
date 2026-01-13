const express = require('express');
const { createReview, getReviews, createEndorsement, getEndorsements } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/modernAuth');

const router = express.Router();

router.post('/reviews', authenticate, createReview);
router.get('/reviews/:lawyer_secure_id', getReviews);
router.post('/endorsements', authenticate, createEndorsement);
router.get('/endorsements/:lawyer_secure_id', getEndorsements);

module.exports = router;
