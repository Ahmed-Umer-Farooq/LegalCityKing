const express = require('express');
const router = express.Router();
const formsController = require('../controllers/formsController');
const { authenticate, authorize } = require('../middleware/modernAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure forms upload directory exists
const formsDir = path.join(__dirname, '../uploads/forms');
if (!fs.existsSync(formsDir)) {
  fs.mkdirSync(formsDir, { recursive: true });
}

// Multer configuration for form uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, formsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'form-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and DOC files are allowed'));
  }
});

// Public routes
router.get('/categories', formsController.getCategories);
router.get('/public', formsController.getForms);
router.get('/public/:id', formsController.getForm);
router.get('/download/:id', formsController.downloadForm);

// Lawyer routes
router.get('/my-forms', authenticate, formsController.getMyForms);
router.post('/create', authenticate, upload.single('file'), formsController.createForm);
router.put('/:id', authenticate, upload.single('file'), formsController.updateForm);
router.delete('/:id', authenticate, formsController.deleteForm);

// Admin routes
router.get('/admin/all', authenticate, authorize('manage', 'all'), formsController.getAllForms);
router.get('/admin/stats', authenticate, authorize('manage', 'all'), formsController.getFormStats);
router.post('/admin/create', authenticate, authorize('manage', 'all'), upload.single('file'), formsController.createForm);
router.put('/admin/:id/approve', authenticate, authorize('manage', 'all'), formsController.approveForm);
router.put('/admin/:id/reject', authenticate, authorize('manage', 'all'), formsController.rejectForm);
router.delete('/admin/:id', authenticate, authorize('manage', 'all'), formsController.deleteForm);

module.exports = router;
