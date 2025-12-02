const { verifyToken } = require('./token');
const db = require('../db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Check if user exists in users or lawyers table
  let user = await db('users').where({ id: decoded.id }).first();
  if (!user) {
    user = await db('lawyers').where({ id: decoded.id }).first();
  }

  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  req.user = { 
    ...decoded, 
    ...user,
    isAdmin: user.is_admin || user.role === 'admin' || false 
  };
  next();
};

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if user exists and is admin
  let user = await db('users').where({ id: decoded.id }).first();
  if (!user) {
    user = await db('lawyers').where({ id: decoded.id }).first();
  }

  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }

  if (user.role !== 'admin' && !user.is_admin) {
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }

  req.user = { ...decoded, isAdmin: true };
  next();
};

const rateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (for production, use Redis or similar)
  const key = req.ip;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!global.rateLimitStore) {
    global.rateLimitStore = {};
  }

  const now = Date.now();
  if (!global.rateLimitStore[key]) {
    global.rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
  } else {
    if (now > global.rateLimitStore[key].resetTime) {
      global.rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
    } else {
      global.rateLimitStore[key].count++;
      if (global.rateLimitStore[key].count > maxRequests) {
        return res.status(429).json({ message: 'Too many requests' });
      }
    }
  }

  next();
};

const authenticateLawyer = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Check if user exists in lawyers table
  const lawyer = await db('lawyers').where({ id: decoded.id }).first();
  if (!lawyer) {
    return res.status(403).json({ message: 'Lawyer not found' });
  }

  req.user = { ...decoded, ...lawyer, role: 'lawyer' };
  next();
};

// Role-based authentication for blogs
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Check both lawyers and users tables
  let user = await db('lawyers').where('id', decoded.id).first();
  if (user) {
    user.role = 'lawyer';
    user.is_verified = user.is_verified || 0;
    user.lawyer_verified = user.lawyer_verified || 0;
  } else {
    user = await db('users').where('id', decoded.id).first();
    if (user) {
      user.role = user.role || 'user';
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = user;
  next();
};

const requireLawyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'lawyer') {
    return res.status(403).json({ message: 'Only lawyers can access this resource' });
  }

  // Check if lawyer is verified
  if (!req.user.is_verified || !req.user.lawyer_verified) {
    return res.status(403).json({ message: 'Only verified lawyers can create blogs' });
  }

  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

const checkBlogOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id, identifier } = req.params;
    const blogIdentifier = id || identifier;

    if (!blogIdentifier) {
      return res.status(400).json({ message: 'Blog identifier required' });
    }

    // Check by secure_id first, then fallback to id for backward compatibility
    let blog = await db('blogs').where('secure_id', blogIdentifier).first();
    if (!blog) {
      blog = await db('blogs').where('id', blogIdentifier).first();
    }
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Admin can access any blog
    if (req.user.role === 'admin') {
      return next();
    }

    // User must own the blog
    if (blog.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You can only modify your own blogs' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking blog ownership' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Check if user exists and is admin
  let user = await db('users').where({ id: decoded.id }).first();
  if (!user) {
    user = await db('lawyers').where({ id: decoded.id }).first();
  }

  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  if (user.role !== 'admin' && !user.is_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.user = { ...decoded, ...user, isAdmin: true };
  next();
};

module.exports = { 
  authenticateToken, 
  authenticateAdmin,
  verifyAdmin, 
  rateLimit, 
  authenticateLawyer,
  requireAuth,
  requireLawyer,
  requireAdmin,
  checkBlogOwnership
};
