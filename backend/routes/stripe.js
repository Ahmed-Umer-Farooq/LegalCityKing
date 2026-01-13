const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  createSubscriptionCheckout,
  createConsultationCheckout,
  createPaymentLinkCheckout,
  getSubscriptionPlans,
  getLawyerEarnings,
  createBillingPortalSession,
  getPaymentReceipt,
  handleWebhook,
  updateSubscriptionStatus,
  cancelSubscription,
  getSubscriptionStatus,
  reactivateSubscription
} = require('../controllers/stripeController');

// Public routes
router.get('/subscription-plans', getSubscriptionPlans);
router.get('/receipt', getPaymentReceipt);

// Protected routes
router.post('/create-subscription-checkout', authenticate, authorize('write', 'payments'), createSubscriptionCheckout);
router.post('/create-consultation-checkout', createConsultationCheckout);
router.post('/create-payment-link-checkout', createPaymentLinkCheckout);
router.get('/lawyer-earnings', authenticate, authorize('read', 'payments'), getLawyerEarnings);
router.post('/create-billing-portal-session', authenticate, createBillingPortalSession);
router.post('/update-subscription-status', authenticate, updateSubscriptionStatus);
router.post('/cancel-subscription', authenticate, cancelSubscription);
router.get('/subscription-status', authenticate, getSubscriptionStatus);
router.post('/reactivate-subscription', authenticate, reactivateSubscription);

// Webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
