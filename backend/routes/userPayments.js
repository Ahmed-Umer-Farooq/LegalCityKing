const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { createPayment } = require('../controllers/unified/paymentController');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.type !== 'user') {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
});

router.post('/pay-lawyer', authorize('write', 'payments'), createPayment);

module.exports = router;
