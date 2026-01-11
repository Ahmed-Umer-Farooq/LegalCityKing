const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  createPaymentLink,
  getPaymentLinks,
  getPaymentLinkById,
  updatePaymentLink,
  deletePaymentLink
} = require('../controllers/paymentLinkController');

// All routes require authentication
router.post('/', authenticateToken, createPaymentLink);
router.get('/', authenticateToken, getPaymentLinks);
router.get('/:linkId', authenticateToken, getPaymentLinkById);
router.put('/:id', authenticateToken, updatePaymentLink);
router.delete('/:id', authenticateToken, deletePaymentLink);

module.exports = router;