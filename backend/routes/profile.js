const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/modernAuth');
const db = require('../db');

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.use(authenticate);

// Get profile data
router.get('/', authorize('manage', 'profile'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    
    let profile;
    if (userType === 'lawyer') {
      const [rows] = await db.execute(
        'SELECT * FROM lawyers WHERE id = ?',
        [userId]
      );
      profile = rows[0];
    } else {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      profile = rows[0];
    }
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Remove sensitive data
    delete profile.password;
    delete profile.google_id;
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile data' });
  }
});

// Upload profile image
router.post('/upload-image', authorize('manage', 'profile'), upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.id;
    const userType = req.user.type;
    const imagePath = `/uploads/profiles/${req.file.filename}`;

    // Update profile image in database
    if (userType === 'lawyer') {
      await db.execute(
        'UPDATE lawyers SET profile_image = ? WHERE id = ?',
        [imagePath, userId]
      );
    } else {
      await db.execute(
        'UPDATE users SET profile_image = ? WHERE id = ?',
        [imagePath, userId]
      );
    }

    res.json({ 
      message: 'Profile image uploaded successfully',
      imagePath: imagePath
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Update profile
router.put('/', authorize('manage', 'profile'), upload.single('profile_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    const updateData = { ...req.body };
    
    // Handle profile image upload if provided
    if (req.file) {
      updateData.profile_image = `/uploads/profiles/${req.file.filename}`;
    }
    
    // Remove sensitive fields
    delete updateData.id;
    delete updateData.password;
    delete updateData.google_id;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Build dynamic query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const table = (userType === 'lawyer') ? 'lawyers' : 'users';
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    await db.execute(query, [...values, userId]);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete profile image
router.delete('/delete-image', authorize('manage', 'profile'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    
    // Get current profile image
    const table = (userType === 'lawyer') ? 'lawyers' : 'users';
    const [rows] = await db.execute(
      `SELECT profile_image FROM ${table} WHERE id = ?`,
      [userId]
    );
    
    if (rows[0]?.profile_image) {
      // Delete file from filesystem
      const imagePath = path.join(__dirname, '..', rows[0].profile_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      // Update database
      await db.execute(
        `UPDATE ${table} SET profile_image = NULL WHERE id = ?`,
        [userId]
      );
    }
    
    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
});

module.exports = router;
