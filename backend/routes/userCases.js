const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  getUserCases,
  createUserCase,
  updateUserCase,
  addCaseDocument,
  addCaseMeeting,
  getCaseStats
} = require('../controllers/userCaseController');

router.get('/', authenticateToken, getUserCases);
router.get('/stats', authenticateToken, getCaseStats);
router.post('/', authenticateToken, createUserCase);
router.put('/:secure_id', authenticateToken, updateUserCase);
router.post('/:secure_id/documents', authenticateToken, addCaseDocument);
router.post('/:secure_id/meetings', authenticateToken, addCaseMeeting);

module.exports = router;