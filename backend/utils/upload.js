const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Secure path validation
const validatePath = (filePath) => {
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
    throw new Error('Invalid file path detected');
  }
  return normalizedPath;
};

// Ensure upload directories exist
const uploadDirs = ['./uploads/documents', './uploads/receipts'];
uploadDirs.forEach(dir => {
  const safePath = validatePath(dir);
  if (!fs.existsSync(safePath)) {
    fs.mkdirSync(safePath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadPath = req.uploadType === 'receipt' ? './uploads/receipts' : './uploads/documents';
      const safePath = validatePath(uploadPath);
      cb(null, safePath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // Sanitize filename
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeExtension = path.extname(sanitizedName).toLowerCase();
      cb(null, file.fieldname + '-' + uniqueSuffix + safeExtension);
    } catch (error) {
      cb(error);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPG, PNG, and TXT files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files per request
  },
  fileFilter: fileFilter
});

module.exports = { upload };