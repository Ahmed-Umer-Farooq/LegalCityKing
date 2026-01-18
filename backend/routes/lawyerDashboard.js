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

// Dashboard routes - allow basic access for all lawyers (free plan included)
router.get('/dashboard/stats', getDashboardStats); // No authorization needed for stats
router.get('/cases', getCases); // Allow all lawyers to view their cases
router.post('/cases', createCase); // Allow all lawyers to create cases
router.get('/clients', getClients); // Allow all lawyers to view their clients
router.get('/appointments', getAppointments); // Allow all lawyers to view appointments
router.get('/documents', getDocuments); // Allow all lawyers to view documents
router.get('/invoices', getInvoices); // Allow all lawyers to view invoices
router.get('/profile', getProfile); // Allow all lawyers to view profile
router.get('/upcoming-events', getUpcomingEvents); // Allow all lawyers to view events

module.exports = router;