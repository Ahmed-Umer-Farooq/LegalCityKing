const express = require('express');
const { authenticate, authorize } = require('../middleware/modernAuth');
const { enforceUserType } = require('../middleware/userTypeEnforcement');
const {
  getDashboardStats,
  getCases,
  createCase,
  getClients,
  getAppointments,
  getDocuments,
  getInvoices,
  getProfile,
  getUpcomingEvents
} = require('../controllers/lawyerDashboardController');

const router = express.Router();

// All routes require lawyer authentication
router.use(authenticate);
router.use(enforceUserType('lawyer'));

// Dashboard routes - already protected by authenticate + enforceUserType
router.get('/dashboard/stats', getDashboardStats);
router.get('/cases', getCases);
router.post('/cases', createCase);
router.get('/clients', getClients);
router.get('/appointments', getAppointments);
router.get('/documents', getDocuments);
router.get('/invoices', getInvoices);
router.get('/profile', getProfile);
router.get('/upcoming-events', getUpcomingEvents);

module.exports = router;