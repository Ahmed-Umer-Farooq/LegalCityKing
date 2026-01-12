const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { createPayment } = require('../controllers/unified/paymentController');

router.post('/pay-lawyer', authenticateToken, createPayment);

module.exports = router;