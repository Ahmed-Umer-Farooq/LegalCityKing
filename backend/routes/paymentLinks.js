const express = require('express');
const router = express.Router();
const { authenticate, authorize, can } = require('../middleware/modernAuth');
const {
  createPaymentLink,
  getPaymentLinks,
  getPaymentLinkById,
  updatePaymentLink,
  deletePaymentLink
} = require('../controllers/paymentLinkController');

// Lawyer-only routes with modern RBAC
router.post('/', authenticate, can('write', 'payments'), createPaymentLink);
router.get('/', authenticate, can('write', 'payments'), getPaymentLinks);
router.put('/:id', authenticate, can('write', 'payments'), updatePaymentLink);
router.delete('/:id', authenticate, can('write', 'payments'), deletePaymentLink);

// Payment link access (users only)
router.get('/:linkId', authenticate, can('read', 'payments'), getPaymentLinkById);

module.exports = router;
