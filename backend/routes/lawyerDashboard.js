const express = require('express');
const { authenticateLawyer } = require('../utils/middleware');
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
router.use(authenticateLawyer);

// Dashboard routes
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