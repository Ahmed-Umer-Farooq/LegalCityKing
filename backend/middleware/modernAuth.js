const jwt = require('jsonwebtoken');
const rbacService = require('../services/rbacService');
const db = require('../db');

// Modern JWT Authentication with RBAC
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from appropriate table based on JWT role claim
    let user;
    let userType = decoded.role || 'user'; // Use role from JWT
    
    // Validate user exists in correct table based on their role
    if (userType === 'lawyer') {
      user = await db('lawyers').where({ id: decoded.id }).first();
      if (!user) {
        console.log(`Lawyer not found for ID: ${decoded.id}`);
        return res.status(403).json({ error: 'Lawyer account not found' });
      }
    } else if (userType === 'admin') {
      user = await db('users').where({ id: decoded.id, is_admin: 1 }).first();
      if (!user) {
        console.log(`Admin not found for ID: ${decoded.id}`);
        return res.status(403).json({ error: 'Admin account not found' });
      }
    } else {
      user = await db('users').where({ id: decoded.id, is_admin: 0 }).first();
      if (!user) {
        console.log(`User not found for ID: ${decoded.id}`);
        return res.status(403).json({ error: 'User account not found' });
      }
    }

    // Get user abilities with forceRefresh for lawyers to always check latest permissions
    const abilities = await rbacService.getUserAbilities(decoded.id, userType === 'admin' ? 'user' : userType, {
      ip: req.ip,
      time: new Date(),
      userAgent: req.get('User-Agent'),
      forceRefresh: userType === 'lawyer' // Always refresh for lawyers
    });

    req.user = {
      id: decoded.id,
      email: user.email,
      type: userType,
      role: userType,  // Add role property for compatibility
      abilities,
      ...user
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Permission-based authorization
const authorize = (action, resource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const canAccess = req.user.abilities.can(action, resource);
    
    if (!canAccess) {
      return res.status(403).json({ 
        error: `Access denied: ${action} ${resource} not allowed`,
        required: `${action}:${resource}`
      });
    }

    next();
  };
};

// Role-based authorization (simplified)
const requireRole = (roleName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userRoles = await rbacService.getUserRoles(req.user.id, req.user.type);
      const hasRole = userRoles.some(role => role.name === roleName);

      if (!hasRole) {
        console.log(`Role access denied: user ${req.user.id} lacks ${roleName} role`);
        return res.status(403).json({ 
          error: `Access denied: ${roleName} role required` 
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role verification failed' });
    }
  };
};

// Enhanced lawyer verification with subscription check
const requireVerifiedLawyer = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'lawyer') {
    return res.status(403).json({ error: 'Lawyer access required' });
  }

  try {
    // Get fresh lawyer data from database
    const lawyer = await db('lawyers')
      .where({ id: req.user.id })
      .first();
    
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer account not found' });
    }

    // Check verification status - approved status is what matters
    const isVerified = lawyer.verification_status === 'approved' || lawyer.is_verified === true;
    
    if (!isVerified) {
      console.log(`Lawyer ${req.user.id} verification check failed:`, {
        verification_status: lawyer.verification_status,
        is_verified: lawyer.is_verified
      });
      return res.status(403).json({ 
        error: 'Account verification required',
        code: 'VERIFICATION_REQUIRED',
        details: {
          verification_status: lawyer.verification_status,
          is_verified: lawyer.is_verified
        }
      });
    }

    // Add subscription info to user object
    req.user.subscription = {
      tier: lawyer.subscription_tier,
      status: lawyer.subscription_status,
      expires_at: lawyer.subscription_expires_at
    };
    
    // Update user object with fresh verification status
    req.user.is_verified = true;
    req.user.verification_status = lawyer.verification_status;
    
  } catch (error) {
    console.error('Lawyer verification check error:', error);
    return res.status(500).json({ error: 'Verification check failed' });
  }

  next();
};

// Payment operation security
const requirePaymentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Check payment permissions
    const canAccess = req.user.abilities.can('write', 'payments') || req.user.abilities.can('read', 'payments');
    
    if (!canAccess) {
      console.log(`Payment access denied for user ${req.user.id} (${req.user.type})`);
      return res.status(403).json({ 
        error: 'Payment access denied'
      });
    }

    next();
  } catch (error) {
    console.error('Payment access check error:', error);
    return res.status(500).json({ error: 'Payment access verification failed' });
  }
};

// Resource ownership verification
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access any resource
    const userRoles = await rbacService.getUserRoles(req.user.id, req.user.type);
    const isAdmin = userRoles.some(role => role.name === 'admin');
    
    if (isAdmin) {
      return next();
    }

    try {
      const resourceId = req.params.id || req.params.identifier;
      let resource;

      switch (resourceType) {
        case 'blog':
          resource = await db('blogs')
            .where('secure_id', resourceId)
            .orWhere('id', resourceId)
            .first();
          break;
        case 'case':
          resource = await db('cases').where('id', resourceId).first();
          break;
        case 'document':
          resource = await db('documents').where('id', resourceId).first();
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      if (!resource) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }

      // Check ownership
      const ownerField = resourceType === 'blog' ? 'author_id' : 'user_id';
      if (resource[ownerField] !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: Resource not owned by user' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Ownership verification failed' });
    }
  };
};

// Check specific permission
const can = (action, resource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = await rbacService.can(req.user.id, req.user.type, action, resource);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Permission denied: cannot ${action} ${resource}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  can,
  requireVerifiedLawyer,
  requirePaymentAccess,
  requireOwnership
};