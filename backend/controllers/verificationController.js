const fs = require('fs');
const db = require('../db');
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
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
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

    // Parse documents for each lawyer
    const parsedPending = pending.map(lawyer => {
      if (lawyer.verification_documents) {
        try {
          lawyer.verification_documents = JSON.parse(lawyer.verification_documents);
        } catch (e) {
          lawyer.verification_documents = [];
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
      .select('id', 'name', 'email', 'verification_status', 'is_verified', 'feature_restrictions', 'verification_notes')
      .orderBy('name', 'asc');

    res.json(lawyers);
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

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'approved',
        is_verified: true,
        verification_notes: notes,
        verification_approved_at: new Date(),
        verified_by: adminId,
        feature_restrictions: restrictions ? JSON.stringify(restrictions) : null
      });

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

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        feature_restrictions: restrictions ? JSON.stringify(restrictions) : null
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
  upload
};