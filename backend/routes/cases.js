const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getCases, getCaseById, createCase, updateCase, deleteCase, getCaseTimeline, getCaseStats } = require('../controllers/unified/caseController');

router.use(authenticate);

// Use correct resource names that match RBAC permissions
router.get('/', authorize('read', 'cases'), getCases);
router.get('/stats', authorize('read', 'cases'), getCaseStats);
router.get('/:id', authorize('read', 'cases'), getCaseById);
router.get('/:id/timeline', authorize('read', 'cases'), getCaseTimeline);
router.post('/', authorize('write', 'cases'), createCase);
router.put('/:id', authorize('write', 'cases'), updateCase);
router.delete('/:id', authorize('write', 'cases'), deleteCase);

module.exports = router;
