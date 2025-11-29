const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../utils/middleware');
const {
  getStats,
  getUsers,
  getLawyers,
  verifyLawyer,
  rejectLawyer,
  deleteUser,
  deleteLawyer,
  makeAdmin,
  removeAdmin,
  getAllChatMessages,
  getActivityLogs
} = require('../controllers/adminController');

// All routes require admin authentication - DISABLED FOR DEVELOPMENT
// router.use(authenticateToken);
// router.use(authenticateAdmin);

// Dashboard statistics
console.log('🔍 Registering /stats route');
router.get('/stats', (req, res) => {
  console.log('📊 Admin stats endpoint hit');
  getStats(req, res);
});

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/make-admin', makeAdmin);
router.put('/users/:id/remove-admin', removeAdmin);

// Lawyer management
router.get('/lawyers', getLawyers);
router.put('/verify-lawyer/:id', verifyLawyer);
router.put('/reject-lawyer/:id', rejectLawyer);
router.delete('/lawyers/:id', deleteLawyer);

// Chat management
router.get('/chat-messages', getAllChatMessages);

// Activity logs
router.get('/activity-logs', getActivityLogs);

// Call history for admin - get all calls
router.get('/call-history', async (req, res) => {
  try {
    const db = require('../db');
    const calls = await db('call_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    console.log('Admin call history query result:', calls.length, 'calls found');
    res.json(calls);
  } catch (error) {
    console.error('Error fetching admin call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

module.exports = router;
