const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { getPayments, createPayment, updatePayment, deletePayment } = require('../controllers/unified/paymentController');

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.put('/:id', authenticateToken, updatePayment);
router.delete('/:id', authenticateToken, deletePayment);

module.exports = router;