const express = require('express');
const passport = require('../config/passport');
const db = require('../db');
const { authenticateToken, authenticateAdmin } = require('../utils/middleware');
const { authLimiter } = require('../utils/limiter');
const { getRedirectPath } = require('../utils/redirectLogic');
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

// Profile routes
router.use('/profile', require('./profile'));

// Registration
router.post('/register-user', authLimiter, registerUser);
router.post('/register-lawyer', authLimiter, registerLawyer);

// Unified register endpoint - intelligently routes to user or lawyer registration
router.post('/register', authLimiter, async (req, res) => {
  // Detect if this is a lawyer registration by checking for lawyer-specific fields
  const isLawyer = req.body.registration_id || req.body.law_firm || req.body.speciality;
  
  if (isLawyer) {
    console.log('🔵 Routing to lawyer registration');
    return registerLawyer(req, res);
  } else {
    console.log('🔵 Routing to user registration');
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

// Password reset with OTP
router.post('/forgot-password-otp', authLimiter, forgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/forgot-password', authLimiter, forgotPasswordOtp);
router.post('/reset-password', resetPassword);

// Profile management
router.get('/me', authenticateToken, getProfile);
router.put('/me', authenticateToken, updateProfile);
router.post('/submit-later', authenticateToken, (req, res) => require('../controllers/authController').submitLater(req, res));
router.delete('/me', authenticateToken, deleteAccount);

// Logout endpoint
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
    
    // Check if user exists
    let user = await db('users').where({ email }).first();
    
    if (user) {
      // User exists - check if it's a password account
      if (user.password && !user.google_id) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Account already exists. Please login with password.')}`);
      }
      // Update google_id if missing
      if (!user.google_id) {
        await db('users').where({ id: user.id }).update({ google_id: profile.id, email_verified: 1 });
        user = await db('users').where({ id: user.id }).first();
      }
    } else {
      // Create new Google user
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
    }
    
    const token = require('../utils/token').generateToken(user);
    
    console.log('🔍 User profile status:', {
      id: user.id,
      profile_completed: user.profile_completed,
      has_basic_info: !!(user.name && user.email)
    });
    
    // If user already has profile completed OR has basic info, go to dashboard
    if (user.profile_completed || (user.name && user.email && user.mobile_number)) {
      const dashboardUrl = `${process.env.FRONTEND_URL}/user-dashboard?token=${token}`;
      console.log('✅ Redirecting existing user to dashboard');
      console.log('🌐 Dashboard URL:', dashboardUrl);
      console.log('🔑 Token length:', token.length);
      console.log('🔑 Token starts with:', token.substring(0, 20));
      
      // Set headers to ensure proper redirect
      res.setHeader('Location', dashboardUrl);
      res.status(302);
      return res.end();
    }
    
    // New user needs profile setup
    const setupUrl = `${process.env.FRONTEND_URL}/google-user-setup?token=${token}`;
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