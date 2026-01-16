const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  getConnectedAccounts,
  getPendingPayoutRequests,
  approvePayout,
  rejectPayout,
  getPlatformEarnings,
  getLawyerDetails,
  getLawyerPayoutHistory,
  getLawyerTransactions,
  getPlatformStatistics
} = require('../controllers/adminPayoutController');

// All routes require authentication and admin role
router.use(authenticate);

// Get all connected accounts
router.get('/connected-accounts', authorize('read', 'admin'), getConnectedAccounts);

// Get payout requests
router.get('/payout-requests', authorize('read', 'admin'), getPendingPayoutRequests);

// Approve payout
router.post('/payout-requests/:id/approve', authorize('write', 'admin'), approvePayout);

// Reject payout
router.post('/payout-requests/:id/reject', authorize('write', 'admin'), rejectPayout);

// Get platform earnings
router.get('/platform-earnings', authorize('read', 'admin'), getPlatformEarnings);

// Get lawyer details
router.get('/lawyer/:id/details', authorize('read', 'admin'), getLawyerDetails);

// Get lawyer payout history
router.get('/lawyer/:id/payouts', authorize('read', 'admin'), getLawyerPayoutHistory);

// Get lawyer transactions
router.get('/lawyer/:id/transactions', authorize('read', 'admin'), getLawyerTransactions);

// Get platform statistics
router.get('/statistics', authorize('read', 'admin'), getPlatformStatistics);

module.exports = router;
