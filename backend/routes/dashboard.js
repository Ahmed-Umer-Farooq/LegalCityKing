const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getOverview, getRecentActivity, getRevenue, getCasesChart } = require('../controllers/dashboardController');

router.use(authenticate);

router.get('/overview', authorize('read', 'profile'), getOverview);
router.get('/recent-activity', authorize('read', 'profile'), getRecentActivity);
router.get('/revenue', authorize('read', 'payments'), getRevenue);
router.get('/cases-chart', authorize('read', 'cases'), getCasesChart);

module.exports = router;
