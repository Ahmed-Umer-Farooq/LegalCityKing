const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/modernAuth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ai-documents/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// Middleware to check if user is a lawyer
const requireLawyer = (req, res, next) => {
  if (req.user && (req.user.role === 'lawyer' || req.user.role === 'premium_lawyer')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Lawyer account required.' });
  }
};

// Routes for lawyers only
router.post('/summarize-document', authenticate, requireLawyer, upload.single('document'), aiController.summarizeDocument);
router.post('/analyze-contract', authenticate, requireLawyer, aiController.analyzeContract);
router.post('/document-chat', authenticate, requireLawyer, aiController.documentChat);

// Routes for all users (including public)
router.post('/chatbot', aiController.chatbot);

module.exports = router;