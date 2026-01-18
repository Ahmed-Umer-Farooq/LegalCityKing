const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/modernAuth');
const db = require('../db');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.type || 'blog';
    let folder = uploadsDir;
    
    if (uploadType === 'profile') {
      folder = path.join(uploadsDir, 'profiles');
    }
    
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const uploadType = req.body.type || 'blog';
    
    if (uploadType === 'profile') {
      cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    } else {
      cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image endpoint
router.post('/image', authenticate, (req, res) => {
  console.log('📤 Upload request received');
  
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('❌ Upload error:', err.message);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('✅ File uploaded successfully:', fileUrl);
      
      // If this is a profile image upload, update the user's profile
      if (req.body.type === 'profile' && req.user) {
        const userType = req.user.role === 'lawyer' ? 'lawyers' : 'users';
        await db(userType).where({ id: req.user.id }).update({ profile_image: fileUrl });
        console.log('✅ Profile image updated in database');
      }
      
      res.json({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('❌ Upload processing error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });
});

module.exports = router;
