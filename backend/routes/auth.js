const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/modernAuth');
const rbacService = require('../services/rbacService');
const { authLimiter } = require('../utils/limiter');
const {
  login,
  verifyEmail,
  forgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
  sendOtp,
  verifyOtp,
} = require('../controllers/authController');
const { registerUser, loginUser } = require('../controllers/userController');
const { registerLawyer, loginLawyer } = require('../controllers/lawyerController');

const router = express.Router();

// Registration with RBAC role assignment
router.post('/register-user', authLimiter, async (req, res) => {
  const result = await registerUser(req, res);
  if (result && result.user) {
    await rbacService.assignRole(result.user.id, 'user', 'user');
  }
});

router.post('/register-lawyer', authLimiter, async (req, res) => {
  const result = await registerLawyer(req, res);
  if (result && result.user) {
    const roleName = result.user.is_verified ? 'verified_lawyer' : 'lawyer';
    await rbacService.assignRole(result.user.id, 'lawyer', roleName);
  }
});

// Unified register endpoint
router.post('/register', authLimiter, async (req, res) => {
  const isLawyer = req.body.registration_id || req.body.law_firm || req.body.speciality;
  
  if (isLawyer) {
    return registerLawyer(req, res);
  } else {
    return registerUser(req, res);
  }
});

// Login
router.post('/login', authLimiter, login);

// Email verification
router.post('/verify-email', verifyEmail);

// OTP endpoints
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);

// Password reset
router.post('/forgot-password-otp', authLimiter, forgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

// Profile management
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.delete('/me', authenticate, deleteAccount);

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
