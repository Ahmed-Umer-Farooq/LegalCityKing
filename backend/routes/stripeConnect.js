const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  createConnectAccount,
  getOnboardingLink,
  getAccountStatus,
  getBalance,
  requestPayout,
  getPayoutHistory,
  completeOnboarding
} = require('../controllers/stripeConnectController');

// All routes require authentication and lawyer role
router.use(authenticate);

// Create Connect account
router.post('/create-account', authorize('write', 'payments'), createConnectAccount);

// Get onboarding link
router.get('/onboarding-link', authorize('read', 'payments'), getOnboardingLink);

// Get account status
router.get('/account-status', authorize('read', 'payments'), getAccountStatus);

// Get balance
router.get('/balance', authorize('read', 'payments'), getBalance);

// Request payout
router.post('/request-payout', authorize('write', 'payments'), requestPayout);

// Get payout history
router.get('/payout-history', authorize('read', 'payments'), getPayoutHistory);

// Complete onboarding
router.post('/complete-onboarding', authorize('write', 'payments'), completeOnboarding);

module.exports = router;
