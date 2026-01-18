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

router.get('/', getCases);
router.get('/stats', getCaseStats);
router.post('/', createCase);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);
router.post('/:id/documents', addCaseDocument);
router.post('/:id/meetings', addCaseMeeting);

module.exports = router;
