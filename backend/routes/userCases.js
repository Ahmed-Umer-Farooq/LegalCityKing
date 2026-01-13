const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  getCases,
  createCase,
  updateCase,
  addCaseDocument,
  addCaseMeeting,
  getCaseStats
} = require('../controllers/unified/caseController');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.type !== 'user') {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
});

router.get('/', authorize('read', 'cases'), getCases);
router.get('/stats', authorize('read', 'cases'), getCaseStats);
router.post('/', authorize('write', 'cases'), createCase);
router.put('/:secure_id', authorize('write', 'cases'), updateCase);
router.post('/:secure_id/documents', authorize('write', 'documents'), addCaseDocument);
router.post('/:secure_id/meetings', authorize('write', 'cases'), addCaseMeeting);

module.exports = router;
