const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  createSubscriptionCheckout,
  createConsultationCheckout,
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
router.post('/create-subscription-checkout', authenticateToken, createSubscriptionCheckout);
router.post('/create-consultation-checkout', createConsultationCheckout);
router.get('/lawyer-earnings', authenticateToken, getLawyerEarnings);
router.post('/create-billing-portal-session', authenticateToken, createBillingPortalSession);
router.post('/update-subscription-status', authenticateToken, updateSubscriptionStatus);
router.post('/cancel-subscription', authenticateToken, cancelSubscription);
router.get('/subscription-status', authenticateToken, getSubscriptionStatus);
router.post('/reactivate-subscription', authenticateToken, reactivateSubscription);

// Webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;