const express = require('express');
const router = express.Router();
const formsController = require('../controllers/formsController');
const { requireAuth, requireLawyer, requireAdmin } = require('../utils/middleware');
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
router.get('/my-forms', requireAuth, formsController.getMyForms);
router.post('/create', requireAuth, upload.single('file'), formsController.createForm);
router.put('/:id', requireAuth, upload.single('file'), formsController.updateForm);
router.delete('/:id', requireAuth, formsController.deleteForm);

// Admin routes
router.get('/admin/all', requireAuth, requireAdmin, formsController.getAllForms);
router.get('/admin/stats', requireAuth, requireAdmin, formsController.getFormStats);
router.post('/admin/create', requireAuth, requireAdmin, upload.single('file'), formsController.createForm);
router.put('/admin/:id/approve', requireAuth, requireAdmin, formsController.approveForm);
router.put('/admin/:id/reject', requireAuth, requireAdmin, formsController.rejectForm);
router.delete('/admin/:id', requireAuth, requireAdmin, formsController.deleteForm);

module.exports = router;
