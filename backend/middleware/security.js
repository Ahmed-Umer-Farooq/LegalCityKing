const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const winston = require('winston');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { newEnforcer } = require('casbin');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const path = require('path');

// Initialize DOMPurify for server-side XSS protection
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'legal-city-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/security.log'), 
      level: 'warn' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Casbin enforcer initialization
let enforcer;
const initializeCasbin = async () => {
  try {
    enforcer = await newEnforcer(
      path.join(__dirname, '../config/rbac_model.conf'),
      path.join(__dirname, '../config/rbac_policy.csv')
    );
    logger.info('Casbin RBAC enforcer initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Casbin enforcer:', error);
  }
};

// Initialize Casbin on module load
initializeCasbin();

// Security Headers Configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
};

// Rate Limiting Configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      res.status(429).json({ error: message });
    }
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests');
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts');
const paymentLimiter = createRateLimiter(60 * 60 * 1000, 10, 'Too many payment attempts');
const strictLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Rate limit exceeded');

// CSRF Protection
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and certain endpoints
  if (req.method === 'GET' || 
      req.path.includes('/api/auth/google') || 
      req.path.includes('/health') ||
      req.path.includes('/api/stripe/webhook')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// XSS Protection Middleware
const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = purify.sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Input Validation Middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && (!value || value.trim() === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value) {
        if (rules.email && !validator.isEmail(value)) {
          errors.push(`${field} must be a valid email`);
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
    }
    
    if (errors.length > 0) {
      logger.warn('Input validation failed', {
        errors,
        ip: req.ip,
        endpoint: req.path
      });
      return res.status(400).json({ errors });
    }
    
    next();
  };
};

// RBAC Authorization Middleware
const authorize = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const userRole = req.user.role || 'user';
      const allowed = await enforcer.enforce(userRole, resource, action);
      
      if (!allowed) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          role: userRole,
          resource,
          action,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Password Security
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// JWT Token Management
const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('JWT verification failed:', error.message);
    return null;
  }
};

// Security Audit Logging
const auditLog = (event, details = {}) => {
  logger.info('Security audit', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Stripe Webhook Signature Verification
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !endpointSecret) {
    logger.warn('Stripe webhook signature missing');
    return res.status(400).json({ error: 'Missing signature' });
  }
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    req.stripeEvent = event;
    next();
  } catch (error) {
    logger.error('Stripe signature verification failed:', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }
};

module.exports = {
  logger,
  securityHeaders,
  corsOptions,
  generalLimiter,
  authLimiter,
  paymentLimiter,
  strictLimiter,
  csrfProtection,
  generateCSRFToken,
  xssProtection,
  validateInput,
  authorize,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  auditLog,
  verifyStripeSignature,
  enforcer
};