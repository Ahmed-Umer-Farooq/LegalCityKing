const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { createPaymentToLawyer } = require('../controllers/userPaymentController');

router.post('/pay-lawyer', authenticateToken, createPaymentToLawyer);

module.exports = router;