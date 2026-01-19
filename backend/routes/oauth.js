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

// Debug endpoint for OAuth troubleshooting
router.get('/debug', (req, res) => {
  const hasGoogleConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasFrontendUrl = !!process.env.FRONTEND_URL;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const hasSessionSecret = !!(process.env.SESSION_SECRET || process.env.JWT_SECRET);
  
  res.json({
    status: 'debug',
    config: {
      googleConfigured: hasGoogleConfig,
      frontendUrlSet: hasFrontendUrl,
      jwtSecretSet: hasJwtSecret,
      sessionSecretSet: hasSessionSecret,
      frontendUrl: process.env.FRONTEND_URL || 'NOT_SET',
      redirectUri: `http://localhost:5001/api/oauth/google/callback`
    },
    session: {
      hasSession: !!req.session,
      sessionId: req.session?.id || 'none'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;