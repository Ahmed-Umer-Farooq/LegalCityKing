const validator = require('validator');
const { logger, auditLog } = require('./security');

// Common validation schemas
const validationSchemas = {
  user: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    email: {
      required: true,
      email: true,
      maxLength: 255
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    },
    mobile_number: {
      required: true,
      pattern: /^\+?[\d\s-()]+$/,
      minLength: 10,
      maxLength: 20
    }
  },
  
  lawyer: {
    registration_id: {
      required: true,
      minLength: 5,
      maxLength: 50,
      pattern: /^[A-Z0-9/-]+$/
    },
    speciality: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    experience_years: {
      required: true,
      numeric: true,
      min: 0,
      max: 70
    },
    hourly_rate: {
      numeric: true,
      min: 0,
      max: 10000
    }
  },
  
  payment: {
    amount: {
      required: true,
      numeric: true,
      min: 1,
      max: 1000000 // $10,000 max
    },
    currency: {
      required: true,
      pattern: /^[A-Z]{3}$/
    },
    description: {
      maxLength: 500
    }
  },
  
  blog: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    content: {
      required: true,
      minLength: 100,
      maxLength: 50000
    },
    category: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
    tags: {
      maxLength: 500
    }
  },
  
  case: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 5000
    },
    case_type: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    priority: {
      pattern: /^(low|medium|high|urgent)$/
    }
  }
};

// Enhanced validation function
const validateField = (value, rules, fieldName) => {
  const errors = [];
  
  // Required field check
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors;
  }
  
  const stringValue = String(value).trim();
  
  // Email validation
  if (rules.email && !validator.isEmail(stringValue)) {
    errors.push(`${fieldName} must be a valid email address`);
  }
  
  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(`${fieldName} format is invalid`);
  }
  
  // Numeric validations
  if (rules.numeric) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`${fieldName} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`${fieldName} must be no more than ${rules.max}`);
      }
    }
  }
  
  // URL validation
  if (rules.url && !validator.isURL(stringValue)) {
    errors.push(`${fieldName} must be a valid URL`);
  }
  
  // Date validation
  if (rules.date && !validator.isISO8601(stringValue)) {
    errors.push(`${fieldName} must be a valid date`);
  }
  
  return errors;
};

// Sanitization functions
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove potentially dangerous characters
  let sanitized = value.trim();
  
  // Escape HTML entities
  sanitized = validator.escape(sanitized);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Security checks
const checkForSQLInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  const sqlPatterns = [
    /('|(\\')|(;)|(\\;)|(\\x27)|(\\x3D))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(<|>|&lt;|&gt;)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
};

const checkForXSS = (value) => {
  if (typeof value !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
};

// Main validation middleware factory
const validate = (schemaName, customRules = {}) => {
  return (req, res, next) => {
    const schema = { ...validationSchemas[schemaName], ...customRules };
    const errors = [];
    const securityIssues = [];
    
    // Sanitize input first
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    
    // Validate each field
    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = req.body[fieldName];
      const fieldErrors = validateField(value, rules, fieldName);
      errors.push(...fieldErrors);
      
      // Security checks
      if (value && typeof value === 'string') {
        if (checkForSQLInjection(value)) {
          securityIssues.push(`Potential SQL injection in ${fieldName}`);
        }
        if (checkForXSS(value)) {
          securityIssues.push(`Potential XSS attack in ${fieldName}`);
        }
      }
    }
    
    // Log security issues
    if (securityIssues.length > 0) {
      auditLog('security_threat_detected', {
        issues: securityIssues,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        userId: req.user?.id
      });
      
      return res.status(400).json({ 
        error: 'Invalid input detected',
        code: 'SECURITY_VIOLATION'
      });
    }
    
    // Return validation errors
    if (errors.length > 0) {
      logger.warn('Validation failed', {
        errors,
        endpoint: req.path,
        ip: req.ip,
        userId: req.user?.id
      });
      
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    next();
  };
};

// Specific validation middlewares
const validateUser = validate('user');
const validateLawyer = validate('lawyer');
const validatePayment = validate('payment');
const validateBlog = validate('blog');
const validateCase = validate('case');

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files || [req.file];
    const errors = [];
    
    files.forEach((file, index) => {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        errors.push(`File ${index + 1}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }
      
      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      }
      
      // Check for malicious file names
      if (/[<>:"/\\|?*]/.test(file.originalname)) {
        errors.push(`File ${index + 1}: Invalid characters in filename`);
      }
    });
    
    if (errors.length > 0) {
      auditLog('file_upload_violation', {
        errors,
        ip: req.ip,
        userId: req.user?.id,
        files: files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype }))
      });
      
      return res.status(400).json({ 
        error: 'File validation failed',
        details: errors 
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateUser,
  validateLawyer,
  validatePayment,
  validateBlog,
  validateCase,
  validateFileUpload,
  sanitizeInput,
  sanitizeObject,
  validationSchemas
};