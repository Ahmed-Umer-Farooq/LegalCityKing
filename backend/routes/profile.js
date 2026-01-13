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
      profile = await db('lawyers').where('id', userId).first();
    } else {
      profile = await db('users').where('id', userId).first();
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
      await db('lawyers').where('id', userId).update({ profile_image: imagePath });
    } else {
      await db('users').where('id', userId).update({ profile_image: imagePath });
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
    
    const table = (userType === 'lawyer') ? 'lawyers' : 'users';
    await db(table).where('id', userId).update(updateData);
    
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
    const profile = await db(table).where('id', userId).first();
    
    if (profile?.profile_image) {
      // Delete file from filesystem
      const imagePath = path.join(__dirname, '..', profile.profile_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      // Update database
      await db(table).where('id', userId).update({ profile_image: null });
    }
    
    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
});

module.exports = router;
