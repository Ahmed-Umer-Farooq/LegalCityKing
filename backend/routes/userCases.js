const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  getCases,
  createCase,
  updateCase,
  addCaseDocument,
  addCaseMeeting,
  getCaseStats
} = require('../controllers/unified/caseController');

router.get('/', authenticateToken, getCases);
router.get('/stats', authenticateToken, getCaseStats);
router.post('/', authenticateToken, createCase);
router.put('/:secure_id', authenticateToken, updateCase);
router.post('/:secure_id/documents', authenticateToken, addCaseDocument);
router.post('/:secure_id/meetings', authenticateToken, addCaseMeeting);

module.exports = router;