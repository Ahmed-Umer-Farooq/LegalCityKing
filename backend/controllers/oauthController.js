const { google } = require('googleapis');
const crypto = require('crypto');
const db = require('../db');
const { generateToken, auditLog, logger } = require('../middleware/security');
const rbacService = require('../services/rbacService');
const oauthConfig = require('../config/oauth');

class OAuthController {
  // Initiate Google OAuth
  async initiateGoogle(req, res) {
    try {
      const role = req.query.role || 'user';
      
      if (!['user', 'lawyer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      const { url, state } = oauthConfig.getAuthURL(role);
      
      // Store state in secure session
      req.session.oauthState = state.split(':')[0];
      req.session.oauthRole = role;
      
      auditLog('oauth_initiated', {
        role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.redirect(url);
    } catch (error) {
      logger.error('OAuth initiation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_init_failed`);
    }
  }

  // Handle Google OAuth callback
  async handleGoogleCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        auditLog('oauth_error', { error, ip: req.ip });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied`);
      }

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
      }

      // Validate state for CSRF protection
      const [receivedState, role] = state.split(':');
      if (!oauthConfig.validateState(req.session.oauthState, receivedState)) {
        auditLog('oauth_csrf_attempt', { ip: req.ip, receivedState });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
      }

      // Exchange code for tokens
      const profile = await this.exchangeCodeForProfile(code);
      if (!profile || !profile.email) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_profile`);
      }

      // Create or get user
      const { user, isNewUser } = await this.createOrGetUser(profile, role);
      
      // Generate secure token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Set secure HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Clear OAuth session data
      delete req.session.oauthState;
      delete req.session.oauthRole;

      auditLog('oauth_success', {
        userId: user.id,
        email: user.email,
        role: user.role,
        isNewUser,
        ip: req.ip
      });

      // Create a temporary redirect page that will handle the authentication
      const redirectHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
          <script>
            // Set a flag for OAuth authentication
            sessionStorage.setItem('oauth_redirect', 'true');
            sessionStorage.setItem('oauth_user', JSON.stringify(${JSON.stringify({
              id: user.id,
              email: user.email,
              role: user.role,
              name: user.name,
              avatar: user.avatar
            })}));
            
            // Redirect to appropriate dashboard
            const dashboardPath = '${user.role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard'}';
            window.location.href = '${process.env.FRONTEND_URL}' + dashboardPath + '?welcome=${isNewUser ? 'true' : 'false'}';
          </script>
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
        </html>
      `;
      
      res.send(redirectHtml);

    } catch (error) {
      logger.error('OAuth callback error:', error);
      auditLog('oauth_callback_error', { error: error.message, ip: req.ip });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  // Exchange authorization code for user profile
  async exchangeCodeForProfile(code) {
    const config = oauthConfig.getGoogleConfig();
    const oauth2Client = new google.auth.OAuth2(
      config.clientID,
      config.clientSecret,
      config.redirectURI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  }

  // Create or get existing user
  async createOrGetUser(profile, role) {
    const email = profile.email;
    
    // Check for existing user in appropriate table
    const tableName = role === 'lawyer' ? 'lawyers' : 'users';
    let user = await db(tableName).where({ email }).first();
    
    if (user) {
      // Existing user - check for conflicts
      if (user.password && !user.google_id) {
        throw new Error('Account exists with password. Please login normally.');
      }
      
      // Update Google ID if missing
      if (!user.google_id) {
        await db(tableName).where({ id: user.id }).update({
          google_id: profile.id,
          email_verified: 1,
          avatar: profile.picture
        });
        user = await db(tableName).where({ id: user.id }).first();
      }
      
      return { user: { ...user, role }, isNewUser: false };
    }

    // Create new user
    const userData = {
      name: profile.name,
      email: profile.email,
      google_id: profile.id,
      email_verified: 1,
      is_verified: 1,
      password: '',
      profile_completed: 1, // Mark as complete to skip forms
      secure_id: crypto.randomBytes(16).toString('hex'),
      avatar: profile.picture,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (role === 'lawyer') {
      userData.verification_status = 'pending';
    } else {
      userData.role = 'user';
      userData.is_admin = 0;
    }

    const [userId] = await db(tableName).insert(userData);
    user = await db(tableName).where({ id: userId }).first();

    // Assign RBAC role
    await rbacService.assignRole(userId, role, role);

    auditLog('oauth_user_created', {
      userId,
      email: profile.email,
      role,
      ip: 'oauth'
    });

    return { user: { ...user, role }, isNewUser: true };
  }

  // Get current user from token
  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get fresh user data
      const tableName = user.role === 'lawyer' ? 'lawyers' : 'users';
      const userData = await db(tableName).where({ id: user.id }).first();

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: user.role,
        avatar: userData.avatar,
        verified: userData.email_verified === 1
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      // Clear auth cookie
      res.clearCookie('auth_token');
      
      if (req.user) {
        auditLog('logout', {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

module.exports = new OAuthController();