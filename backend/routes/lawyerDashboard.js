const express = require('express');
const { authenticate, authorize } = require('../middleware/modernAuth');
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
router.use((req, res, next) => {
  if (req.user.type !== 'lawyer') {
    return res.status(403).json({ error: 'Lawyer access required' });
  }
  next();
});

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/cases', authorize('manage', 'cases'), getCases);
router.post('/cases', authorize('manage', 'cases'), createCase);
router.get('/clients', getClients);
router.get('/appointments', getAppointments);
router.get('/documents', authorize('read', 'documents'), getDocuments);
router.get('/invoices', getInvoices);
router.get('/profile', getProfile);
router.get('/upcoming-events', getUpcomingEvents);

module.exports = router;
