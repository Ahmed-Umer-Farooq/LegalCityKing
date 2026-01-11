const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../utils/middleware');
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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload profile image
router.post('/upload-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Determine user table
    let user = await db('users').where({ id: req.user.id }).first();
    let tableName = 'users';
    
    if (!user) {
      user = await db('lawyers').where({ id: req.user.id }).first();
      tableName = 'lawyers';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile image if exists
    if (user.profile_image) {
      const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profile_image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update database with new image URL
    await db(tableName).where({ id: req.user.id }).update({
      profile_image: imageUrl
    });

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile image' });
  }
});

// Update profile
router.put('/', authenticateToken, upload.single('profile_image'), async (req, res) => {
  try {
    const { name, username, mobile_number, address, city, state, zip_code, country } = req.body;
    
    // Determine user table
    let user = await db('users').where({ id: req.user.id }).first();
    let tableName = 'users';
    
    if (!user) {
      user = await db('lawyers').where({ id: req.user.id }).first();
      tableName = 'lawyers';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      name,
      username,
      mobile_number,
      address,
      city,
      state,
      zip_code,
      country
    };

    // Handle profile image if uploaded
    if (req.file) {
      // Delete old profile image if exists
      if (user.profile_image) {
        const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profile_image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.profile_image = `/uploads/profiles/${req.file.filename}`;
    }

    // Update database
    await db(tableName).where({ id: req.user.id }).update(updateData);

    // Get updated user data
    const updatedUser = await db(tableName).where({ id: req.user.id }).first();

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Delete profile image
router.delete('/delete-image', authenticateToken, async (req, res) => {
  try {
    // Determine user table
    let user = await db('users').where({ id: req.user.id }).first();
    let tableName = 'users';
    
    if (!user) {
      user = await db('lawyers').where({ id: req.user.id }).first();
      tableName = 'lawyers';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete image file if exists
    if (user.profile_image) {
      const imagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profile_image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Update database
    await db(tableName).where({ id: req.user.id }).update({
      profile_image: null
    });

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Profile image delete error:', error);
    res.status(500).json({ message: 'Failed to delete profile image' });
  }
});

module.exports = router;