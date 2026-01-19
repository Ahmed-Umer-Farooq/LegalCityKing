const express = require('express');
const oauthController = require('../controllers/oauthController');
const oauthSecurity = require('../middleware/oauthSecurity');

const router = express.Router();

// Apply rate limiting to all OAuth routes
router.use(oauthSecurity.createOAuthLimiter());

// Initiate Google OAuth
router.get('/google', oauthController.initiateGoogle.bind(oauthController));

// Handle Google OAuth callback
router.get('/google/callback', oauthController.handleGoogleCallback.bind(oauthController));

// Get current authenticated user
router.get('/me', 
  oauthSecurity.authenticate.bind(oauthSecurity),
  oauthController.getCurrentUser.bind(oauthController)
);

// Logout
router.post('/logout', 
  oauthSecurity.authenticate.bind(oauthSecurity),
  oauthController.logout.bind(oauthController)
);

// Health check for OAuth system
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    oauth: 'ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;