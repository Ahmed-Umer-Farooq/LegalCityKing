const crypto = require('crypto');

class OAuthConfig {
  constructor() {
    this.validateEnvironment();
  }

  validateEnvironment() {
    const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing OAuth environment variables: ${missing.join(', ')}`);
    }
  }

  getGoogleConfig() {
    return {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `http://localhost:5001/api/oauth/google/callback`,
      scope: ['profile', 'email']
    };
  }

  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  validateState(sessionState, receivedState) {
    return sessionState && receivedState && sessionState === receivedState;
  }

  getAuthURL(role = 'user') {
    const config = this.getGoogleConfig();
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: config.clientID,
      redirect_uri: config.redirectURI,
      scope: config.scope.join(' '),
      response_type: 'code',
      state: `${state}:${role}`,
      access_type: 'offline'
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state
    };
  }
}

module.exports = new OAuthConfig();