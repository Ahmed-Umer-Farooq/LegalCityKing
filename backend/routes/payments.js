const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getPayments, createPayment, updatePayment, deletePayment } = require('../controllers/unified/paymentController');

router.use(authenticate);

router.get('/', authorize('read', 'payments'), getPayments);
router.post('/', authorize('write', 'payments'), createPayment);
router.put('/:id', authorize('write', 'payments'), updatePayment);
router.delete('/:id', authorize('write', 'payments'), deletePayment);

module.exports = router;

module.exports = router;
