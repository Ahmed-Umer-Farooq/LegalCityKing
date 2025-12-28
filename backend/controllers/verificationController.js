const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure multer for verification documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/verification/');
  },
  filename: (req, file, cb) => {
    cb(null, `verification-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

const submitVerification = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { documents } = req.body;

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'submitted',
        verification_documents: JSON.stringify(documents || []),
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
      .select('verification_status', 'verification_documents', 'verification_notes', 'verified')
      .where('id', lawyerId)
      .first();

    res.json(lawyer);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin functions
const getPendingVerifications = async (req, res) => {
  try {
    const pending = await db('lawyers')
      .select('id', 'name', 'email', 'verification_status', 'verification_submitted_at', 'verification_documents')
      .where('verification_status', 'submitted')
      .orderBy('verification_submitted_at', 'asc');

    res.json(pending);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveVerification = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    await db('lawyers')
      .where('id', lawyerId)
      .update({
        verification_status: 'approved',
        verified: true,
        verification_notes: notes,
        verification_approved_at: new Date(),
        verified_by: adminId
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
        verification_notes: notes
      });

    res.json({ message: 'Lawyer verification rejected' });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  upload
};