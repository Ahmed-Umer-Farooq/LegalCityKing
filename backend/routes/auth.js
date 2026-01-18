const express = require('express');
const passport = require('../config/passport');
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

// Debug endpoint
router.get('/debug-oauth', (req, res) => {
  res.json({
    session: req.session,
    query: req.query,
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      FRONTEND_URL: process.env.FRONTEND_URL
    }
  });
});

// OAuth routes
router.get('/google', (req, res, next) => {
  console.log('🔵 Google OAuth initiated with role:', req.query.role);
  // Store role in session for callback
  if (req.query.role) {
    req.session.oauthRole = req.query.role;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Lawyer-specific Google OAuth
router.get('/google/lawyer', (req, res, next) => {
  req.session.oauthRole = 'lawyer';
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', async (req, res) => {
  try {
    console.log('🔵 Google callback received:', req.query);
    
    // Handle OAuth manually
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }
    
    // Exchange code for tokens
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    
    console.log('👤 Google profile:', profile.id, profile.name);
    
    const email = profile.email;
    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
    }
    
    // Get intended role from session
    const intendedRole = req.session.oauthRole || 'user';
    console.log('🎯 Intended role from session:', intendedRole);
    
    let user;
    let userRole = 'user';
    
    // Check both tables for existing user
    let existingUser = await db('users').where({ email }).first();
    let existingLawyer = await db('lawyers').where({ email }).first();
    
    // If user exists and intended role matches their table, use existing account
    if (existingUser && intendedRole === 'user') {
      user = existingUser;
      userRole = 'user';
      if (user.password && !user.google_id) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Account already exists. Please login with password.')}`);
      }
      if (!user.google_id) {
        await db('users').where({ id: user.id }).update({ google_id: profile.id, email_verified: 1 });
        user = await db('users').where({ id: user.id }).first();
      }
    } else if (existingLawyer && intendedRole === 'lawyer') {
      user = existingLawyer;
      userRole = 'lawyer';
      if (user.password && !user.google_id) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Account already exists. Please login with password.')}`);
      }
      if (!user.google_id) {
        await db('lawyers').where({ id: user.id }).update({ google_id: profile.id, email_verified: 1 });
        user = await db('lawyers').where({ id: user.id }).first();
      }
    } else if (existingUser || existingLawyer) {
      // User exists but in wrong table for intended role
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Account exists with different role. Please login normally.')}`);
    } else {
      // Create new user based on intended role
      if (intendedRole === 'lawyer') {
        const [id] = await db('lawyers').insert({
          name: profile.name,
          email,
          google_id: profile.id,
          email_verified: 1,
          is_verified: 1,
          password: '',
          profile_completed: 0,
          secure_id: require('crypto').randomBytes(16).toString('hex'),
          avatar: profile.picture
        });
        user = await db('lawyers').where({ id }).first();
        userRole = 'lawyer';
      } else {
        const [id] = await db('users').insert({
          name: profile.name,
          email,
          google_id: profile.id,
          email_verified: 1,
          is_verified: 1,
          password: '',
          role: 'user',
          profile_completed: 0,
          secure_id: require('crypto').randomBytes(16).toString('hex'),
          avatar: profile.picture
        });
        user = await db('users').where({ id }).first();
        userRole = 'user';
      }
    }
    
    // Generate token with correct role
    const tokenUser = { ...user, role: userRole };
    const token = require('../utils/token').generateToken(tokenUser);
    
    console.log('🔍 User profile status:', {
      id: user.id,
      profile_completed: user.profile_completed,
      has_basic_info: !!(user.name && user.email)
    });
    
    // If user already has profile completed, go to appropriate dashboard
    if (user.profile_completed) {
      const dashboardUrl = userRole === 'lawyer' 
        ? `${process.env.FRONTEND_URL}/lawyer-dashboard?token=${token}`
        : `${process.env.FRONTEND_URL}/user-dashboard?token=${token}`;
      console.log('✅ Redirecting existing user to dashboard');
      console.log('🌐 Dashboard URL:', dashboardUrl);
      
      res.setHeader('Location', dashboardUrl);
      res.status(302);
      return res.end();
    }
    
    // New user needs profile setup
    const setupUrl = userRole === 'lawyer'
      ? `${process.env.FRONTEND_URL}/google-lawyer-setup?token=${token}`
      : `${process.env.FRONTEND_URL}/google-user-setup?token=${token}`;
    console.log('🆕 Redirecting new user to profile setup:', setupUrl);
    res.redirect(setupUrl);
    
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/` }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/?token=${req.user.token}`);
  }
);

module.exports = router;
