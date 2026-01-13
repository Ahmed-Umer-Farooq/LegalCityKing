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

// Dashboard routes with proper authorization
router.get('/dashboard/stats', authorize('read', 'dashboard'), getDashboardStats);
router.get('/cases', authorize('read', 'cases'), getCases);
router.post('/cases', authorize('write', 'cases'), createCase);
router.get('/clients', authorize('read', 'clients'), getClients);
router.get('/appointments', authorize('read', 'appointments'), getAppointments);
router.get('/documents', authorize('read', 'documents'), getDocuments);
router.get('/invoices', authorize('read', 'invoices'), getInvoices);
router.get('/profile', authorize('read', 'profile'), getProfile);
router.get('/upcoming-events', authorize('read', 'events'), getUpcomingEvents);

module.exports = router;