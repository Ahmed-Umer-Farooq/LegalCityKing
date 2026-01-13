const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { upload } = require('../utils/upload');
const { getAllDocuments, uploadDocument, getDocumentById, updateDocument, deleteDocument, downloadDocument } = require('../controllers/documentController');

router.use(authenticate);

router.get('/', authorize('read', 'documents'), getAllDocuments);
router.get('/:id', authorize('read', 'documents'), getDocumentById);
router.get('/:id/download', authorize('read', 'documents'), downloadDocument);
router.post('/', authorize('write', 'documents'), (req, res, next) => {
  req.uploadType = 'document';
  next();
}, upload.single('document'), uploadDocument);
router.put('/:id', authorize('write', 'documents'), updateDocument);
router.delete('/:id', authorize('write', 'documents'), deleteDocument);

module.exports = router;
