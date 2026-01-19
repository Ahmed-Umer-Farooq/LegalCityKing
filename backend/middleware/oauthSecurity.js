const jwt = require('jsonwebtoken');
const db = require('../db');
const rbacService = require('../services/rbacService');
const { auditLog, logger } = require('../middleware/security');

class OAuthSecurity {
  // Authenticate user from HTTP-only cookie
  async authenticate(req, res, next) {
    try {
      // Get token from HTTP-only cookie (more secure than localStorage)
      const token = req.cookies.auth_token;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Validate user exists and is active
      const user = await this.validateUser(decoded);
      if (!user) {
        res.clearCookie('auth_token');
        return res.status(403).json({ error: 'Invalid user account' });
      }

      // Load RBAC abilities
      const abilities = await rbacService.getUserAbilities(
        decoded.id, 
        decoded.role,
        { ip: req.ip, time: new Date() }
      );

      // Attach user and abilities to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        abilities
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'Token expired' });
      }
      
      if (error.name === 'JsonWebTokenError') {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'Invalid token' });
      }

      logger.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Validate user exists and is active
  async validateUser(decoded) {
    try {
      let user;
      
      if (decoded.role === 'lawyer') {
        user = await db('lawyers').where({ 
          id: decoded.id,
          email: decoded.email 
        }).first();
      } else {
        user = await db('users').where({ 
          id: decoded.id,
          email: decoded.email,
          is_active: 1 
        }).first();
      }

      return user;
    } catch (error) {
      logger.error('User validation error:', error);
      return null;
    }
  }

  // Check if user has specific role
  requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = req.user.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(userRole)) {
        auditLog('unauthorized_access', {
          userId: req.user.id,
          requiredRoles: roles,
          userRole,
          path: req.path,
          ip: req.ip
        });
        
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  // Check RBAC permission
  requirePermission(action, resource) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.abilities) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const can = req.user.abilities.can(action, resource);
        
        if (!can) {
          auditLog('permission_denied', {
            userId: req.user.id,
            action,
            resource,
            path: req.path,
            ip: req.ip
          });
          
          return res.status(403).json({ error: 'Permission denied' });
        }

        next();
      } catch (error) {
        logger.error('Permission check error:', error);
        res.status(500).json({ error: 'Permission check failed' });
      }
    };
  }

  // Rate limiting for OAuth endpoints
  createOAuthLimiter() {
    const rateLimit = require('express-rate-limit');
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 10 : 100, // More attempts in development
      message: { error: 'Too many OAuth attempts. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        auditLog('oauth_rate_limit', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        res.status(429).json({ error: 'Too many OAuth attempts. Please try again later.' });
      }
    });
  }

  // CSRF protection for OAuth
  validateCSRF(req, res, next) {
    // OAuth state parameter provides CSRF protection
    // Additional validation can be added here if needed
    next();
  }
}

module.exports = new OAuthSecurity();