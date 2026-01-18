const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { enforceUserType } = require('../middleware/userTypeEnforcement');
const {
  getCases,
  createCase,
  updateCase,
  deleteCase,
  addCaseDocument,
  addCaseMeeting,
  getCaseStats
} = require('../controllers/unified/caseController');

router.use(authenticate);
router.use(enforceUserType('user'));

router.get('/', authorize('read', 'cases'), getCases);
router.get('/stats', authorize('read', 'cases'), getCaseStats);
router.post('/', authorize('write', 'cases'), createCase);
router.put('/:id', authorize('write', 'cases'), updateCase);
router.delete('/:id', authorize('delete', 'cases'), deleteCase);
router.post('/:id/documents', authorize('write', 'documents'), addCaseDocument);
router.post('/:id/meetings', authorize('write', 'cases'), addCaseMeeting);

module.exports = router;
