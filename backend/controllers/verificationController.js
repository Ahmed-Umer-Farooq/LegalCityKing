const fs = require('fs');
const db = require('../db');
const rbacService = require('../services/rbacService');
const multer = require('multer');
const path = require('path');

// Ensure upload directory exists
const uploadDir = 'uploads/verification/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for verification documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/verification/');
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    cb(null, `verification-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ];
    
    // Allowed extensions
    const allowedExts = /\.(jpeg|jpg|png|pdf)$/i;
    
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.includes(file.mimetype);
    
    // Check for null bytes (directory traversal attempt)
    if (file.originalname.includes('\0')) {
      return cb(new Error('Invalid filename'));
    }
    
    // Check for path traversal patterns
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename'));
    }
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

const submitVerification = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Get uploaded file paths
    const documentPaths = req.files ? req.files.map(file => file.filename) : [];
    
    if (documentPaths.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'submitted',
        verification_documents: JSON.stringify(documentPaths),
        verification_submitted_at: new Date()
      });

    res.json({ message: 'Verification documents submitted successfully' });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers')
      .select('verification_status', 'verification_documents', 'verification_notes', 'is_verified')
      .where('id', lawyerId)
      .first();

    if (lawyer) {
      // Parse documents if they exist
      if (lawyer.verification_documents) {
        try {
          lawyer.verification_documents = JSON.parse(lawyer.verification_documents);
        } catch (e) {
          lawyer.verification_documents = [];
        }
      }
    }

    res.json(lawyer || { verification_status: 'pending' });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin functions
const getPendingVerifications = async (req, res) => {
  try {
    const pending = await db('lawyers')
      .select('id', 'name', 'email', 'verification_status', 'verification_submitted_at', 'verification_documents', 'feature_restrictions')
      .where('verification_status', 'submitted')
      .orderBy('verification_submitted_at', 'asc');

    // Parse documents and ensure all features are included
    const parsedPending = pending.map(lawyer => {
      if (lawyer.verification_documents) {
        try {
          lawyer.verification_documents = JSON.parse(lawyer.verification_documents);
        } catch (e) {
          lawyer.verification_documents = [];
        }
      }
      
      // Ensure all features are included in restrictions object
      if (lawyer.feature_restrictions) {
        try {
          const parsed = JSON.parse(lawyer.feature_restrictions);
          const allFeatures = {
            cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
            payment_links: false, quick_actions: false, payment_records: false,
            calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
            reports: false, forms: false, profile: false, subscription: false, home: false,
            ai_analyzer: false
          };
          lawyer.feature_restrictions = JSON.stringify({ ...allFeatures, ...parsed });
        } catch (e) {
          lawyer.feature_restrictions = null;
        }
      }
      
      return lawyer;
    });

    res.json(parsedPending);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllLawyers = async (req, res) => {
  try {
    const lawyers = await db('lawyers')
      .select('id', 'name', 'email', 'verification_status', 'is_verified', 'feature_restrictions', 'verification_notes', 'verification_documents')
      .orderBy('name', 'asc');

    // Parse documents and ensure all features are included in restrictions
    const parsedLawyers = lawyers.map(lawyer => {
      if (lawyer.verification_documents) {
        try {
          lawyer.verification_documents = JSON.parse(lawyer.verification_documents);
        } catch (e) {
          lawyer.verification_documents = [];
        }
      }
      
      // Ensure all features are included in restrictions object
      if (lawyer.feature_restrictions) {
        try {
          const parsed = JSON.parse(lawyer.feature_restrictions);
          const allFeatures = {
            cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
            payment_links: false, quick_actions: false, payment_records: false,
            calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
            reports: false, forms: false, profile: false, subscription: false, home: false,
            ai_analyzer: false
          };
          lawyer.feature_restrictions = JSON.stringify({ ...allFeatures, ...parsed });
        } catch (e) {
          lawyer.feature_restrictions = null;
        }
      }
      
      return lawyer;
    });

    res.json(parsedLawyers);
  } catch (error) {
    console.error('Get all lawyers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'name', 'first_name', 'last_name', 'email', 'feature_restrictions')
      .where('role', 'user')
      .orderBy('name', 'asc');

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveVerification = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { notes, restrictions } = req.body;
    const adminId = req.user.id;

    // Ensure all features are included in the restrictions object
    const allFeatures = {
      cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
      payment_links: false, quick_actions: false, payment_records: false,
      calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
      reports: false, forms: false, profile: false, subscription: false, home: false,
      ai_analyzer: false
    };
    
    const finalRestrictions = restrictions ? { ...allFeatures, ...restrictions } : null;

    // Update lawyer verification status and set feature restrictions
    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'approved',
        is_verified: true,
        verification_notes: notes,
        verification_approved_at: new Date(),
        verified_by: adminId,
        feature_restrictions: finalRestrictions ? JSON.stringify(finalRestrictions) : null
      });

    // Assign verified_lawyer role
    const verifiedRole = await db('roles').where('name', 'verified_lawyer').first();
    if (verifiedRole) {
      const existingRole = await db('user_roles')
        .where({ user_id: lawyerId, user_type: 'lawyer', role_id: verifiedRole.id })
        .first();
      
      if (!existingRole) {
        await db('user_roles').insert({
          user_id: lawyerId,
          user_type: 'lawyer',
          role_id: verifiedRole.id
        });
      }
      
      rbacService.clearUserCache(lawyerId, 'lawyer');
    }

    res.json({ message: 'Lawyer verification approved' });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectVerification = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { notes } = req.body;

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'rejected',
        is_verified: false,
        verification_notes: notes
      });

    res.json({ message: 'Lawyer verification rejected' });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRestrictions = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { restrictions } = req.body;

    // Ensure all features are included in the restrictions object
    const allFeatures = {
      cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
      payment_links: false, quick_actions: false, payment_records: false,
      calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
      reports: false, forms: false, profile: false, subscription: false, home: false,
      ai_analyzer: false
    };
    
    const finalRestrictions = restrictions ? { ...allFeatures, ...restrictions } : null;

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        feature_restrictions: finalRestrictions ? JSON.stringify(finalRestrictions) : null
      });

    res.json({ message: 'Restrictions updated successfully' });
  } catch (error) {
    console.error('Update restrictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserRestrictions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restrictions } = req.body;

    await db('users')
      .where('id', userId)
      .update({
        feature_restrictions: restrictions ? JSON.stringify(restrictions) : null
      });

    res.json({ message: 'User restrictions updated successfully' });
  } catch (error) {
    console.error('Update user restrictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVerificationDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log('Document request - User:', req.user);
    console.log('Requested filename:', filename);
    
    // Verify admin access
    if (!req.user) {
      console.log('No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const isAdmin = req.user.is_admin === 1 || req.user.is_admin === true || req.user.type === 'admin';
    if (!isAdmin) {
      console.log('User is not admin:', req.user);
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Sanitize filename - prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    
    // Additional security checks
    if (sanitizedFilename.includes('..') || sanitizedFilename.includes('\0')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Verify file extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    const filePath = path.join(__dirname, '../uploads/verification/', sanitizedFilename);
    console.log('File path:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate content type and security headers
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    console.log('Sending file:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get verification document error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  getAllLawyers,
  getAllUsers,
  approveVerification,
  rejectVerification,
  updateRestrictions,
  updateUserRestrictions,
  getVerificationDocument,
  upload
};