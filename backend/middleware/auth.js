const { verifyToken, authorize, logger, auditLog } = require('./security');
const db = require('../db');

// Enhanced JWT Authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    auditLog('auth_failed', {
      reason: 'missing_token',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    auditLog('auth_failed', {
      reason: 'invalid_token',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    // Check users table first to preserve admin status
    let user = await db('users').where({ id: decoded.id }).first();
    if (!user) {
      user = await db('lawyers').where({ id: decoded.id }).first();
      if (user) {
        user.role = 'lawyer';
      }
    }

    if (!user) {
      auditLog('auth_failed', {
        reason: 'user_not_found',
        userId: decoded.id,
        ip: req.ip,
        endpoint: req.path
      });
      return res.status(403).json({ error: 'User not found' });
    }

    // Enhanced user object with security context
    req.user = { 
      ...decoded, 
      ...user,
      isAdmin: user.is_admin || user.role === 'admin' || false,
      securityContext: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        loginTime: new Date()
      }
    };

    auditLog('auth_success', {
      userId: user.id,
      role: user.role || 'user',
      ip: req.ip,
      endpoint: req.path
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based middleware with RBAC integration
const requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || 'user';
    
    if (userRole !== role && !req.user.isAdmin) {
      auditLog('authorization_failed', {
        userId: req.user.id,
        requiredRole: role,
        userRole: userRole,
        ip: req.ip,
        endpoint: req.path
      });
      return res.status(403).json({ error: `${role} access required` });
    }

    next();
  };
};

// Enhanced admin verification
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin && req.user.role !== 'admin') {
    auditLog('admin_access_denied', {
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(403).json({ error: 'Admin access required' });
  }

  auditLog('admin_access_granted', {
    userId: req.user.id,
    ip: req.ip,
    endpoint: req.path
  });

  next();
};

// Enhanced lawyer verification with subscription check
const requireVerifiedLawyer = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'lawyer') {
    return res.status(403).json({ error: 'Lawyer access required' });
  }

  // Check verification status
  if (!req.user.is_verified && !req.user.lawyer_verified) {
    auditLog('unverified_lawyer_access', {
      userId: req.user.id,
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(403).json({ 
      error: 'Account verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }

  // Check subscription status for premium features
  try {
    const subscription = await db('user_subscriptions')
      .where({ user_id: req.user.id, status: 'active' })
      .first();
    
    req.user.subscription = subscription;
    
    auditLog('verified_lawyer_access', {
      userId: req.user.id,
      hasSubscription: !!subscription,
      ip: req.ip,
      endpoint: req.path
    });
  } catch (error) {
    logger.error('Subscription check error:', error);
  }

  next();
};

// Payment operation security
const requirePaymentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Enhanced logging for payment operations
  auditLog('payment_access', {
    userId: req.user.id,
    role: req.user.role,
    operation: req.method,
    endpoint: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    amount: req.body.amount,
    currency: req.body.currency
  });

  // Additional security checks for high-value transactions
  if (req.body.amount && req.body.amount > 10000) { // $100+
    auditLog('high_value_payment', {
      userId: req.user.id,
      amount: req.body.amount,
      ip: req.ip
    });
  }

  next();
};

// Resource ownership verification
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access any resource
    if (req.user.isAdmin) {
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
        auditLog('ownership_violation', {
          userId: req.user.id,
          resourceType,
          resourceId,
          ownerId: resource[ownerField],
          ip: req.ip
        });
        return res.status(403).json({ error: 'Access denied: Resource not owned by user' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({ error: 'Ownership verification failed' });
    }
  };
};

// Session security middleware
const validateSession = (req, res, next) => {
  if (req.user && req.user.securityContext) {
    const sessionAge = Date.now() - new Date(req.user.securityContext.loginTime).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxSessionAge) {
      auditLog('session_expired', {
        userId: req.user.id,
        sessionAge: sessionAge,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireVerifiedLawyer,
  requirePaymentAccess,
  requireOwnership,
  validateSession,
  // Legacy compatibility
  authenticateAdmin: requireAdmin,
  authenticateLawyer: requireRole('lawyer'),
  requireAuth: authenticateToken,
  requireLawyer: requireRole('lawyer')
};