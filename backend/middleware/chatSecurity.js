const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const validator = require('validator');

// Rate limiting for chat messages
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: { error: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Spam detection patterns
const spamPatterns = [
  /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
  /\b(click here|free money|make money fast|get rich quick)\b/i,
  /\b(nigerian prince|inheritance|million dollars|tax refund)\b/i,
  /\b(crypto|bitcoin|investment opportunity|trading bot)\b/i,
  /(.)\1{10,}/, // Repeated characters
  /[A-Z]{5,}.*[A-Z]{5,}/, // Excessive caps
];

// Malicious link patterns
const maliciousPatterns = [
  /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly/i, // URL shorteners
  /\.(tk|ml|ga|cf)$/i, // Suspicious TLDs
  /phishing|malware|virus|trojan/i,
  /download.*\.(exe|bat|scr|com|pif)$/i,
];

// File type validation
const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

// Content validation middleware
const validateContent = (req, res, next) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid message content' });
  }

  // Check for spam patterns
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return res.status(400).json({ 
        error: 'Message blocked: Potential spam detected',
        code: 'SPAM_DETECTED'
      });
    }
  }

  // Validate and check URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  
  for (const url of urls) {
    // Validate URL format
    if (!validator.isURL(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL detected',
        code: 'INVALID_URL'
      });
    }

    // Check for malicious patterns
    for (const pattern of maliciousPatterns) {
      if (pattern.test(url)) {
        return res.status(400).json({ 
          error: 'Suspicious link blocked',
          code: 'MALICIOUS_LINK'
        });
      }
    }
  }

  // Content length validation
  if (content.length > 2000) {
    return res.status(400).json({ 
      error: 'Message too long (max 2000 characters)',
      code: 'MESSAGE_TOO_LONG'
    });
  }

  next();
};

// File validation middleware
const validateFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const { mimetype, size, originalname } = req.file;

  // Check file type
  if (!allowedFileTypes.includes(mimetype)) {
    return res.status(400).json({ 
      error: 'File type not allowed',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Check file size
  if (size > maxFileSize) {
    return res.status(400).json({ 
      error: 'File too large (max 10MB)',
      code: 'FILE_TOO_LARGE'
    });
  }

  // Check filename for suspicious patterns
  if (/\.(exe|bat|scr|com|pif|js|vbs)$/i.test(originalname)) {
    return res.status(400).json({ 
      error: 'Executable files not allowed',
      code: 'EXECUTABLE_FILE'
    });
  }

  next();
};

// Message encryption/decryption
const encryptMessage = (content, key) => {
  try {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return content; // Return original if encryption fails
  }
};

const decryptMessage = (encryptedContent, key) => {
  try {
    if (!encryptedContent || !encryptedContent.includes(':')) {
      return encryptedContent; // Return as-is if not encrypted format
    }
    
    const algorithm = 'aes-256-cbc';
    const parts = encryptedContent.split(':');
    if (parts.length !== 2) {
      return encryptedContent; // Return as-is if invalid format
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedContent; // Return encrypted content if decryption fails
  }
};

// User verification middleware
const verifyUserAccess = async (req, res, next) => {
  const { sender_id, sender_type, receiver_id, receiver_type } = req.body;
  
  try {
    const db = req.app.get('db');
    
    // Verify sender exists and is active
    let senderQuery, senderTable;
    if (sender_type === 'lawyer') {
      senderTable = 'lawyers';
      senderQuery = 'SELECT id, status FROM lawyers WHERE id = ?';
    } else {
      senderTable = 'users';
      senderQuery = 'SELECT id, status FROM users WHERE id = ?';
    }
    
    const [senderRows] = await db.execute(senderQuery, [sender_id]);
    if (senderRows.length === 0 || senderRows[0].status !== 'active') {
      return res.status(403).json({ 
        error: 'Sender not authorized',
        code: 'SENDER_UNAUTHORIZED'
      });
    }

    // Verify receiver exists and is active
    let receiverQuery;
    if (receiver_type === 'lawyer') {
      receiverQuery = 'SELECT id, status FROM lawyers WHERE id = ?';
    } else {
      receiverQuery = 'SELECT id, status FROM users WHERE id = ?';
    }
    
    const [receiverRows] = await db.execute(receiverQuery, [receiver_id]);
    if (receiverRows.length === 0 || receiverRows[0].status !== 'active') {
      return res.status(403).json({ 
        error: 'Receiver not found or inactive',
        code: 'RECEIVER_UNAUTHORIZED'
      });
    }

    next();
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Audit logging
const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log security events
    if (res.statusCode >= 400) {
      const logData = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.body.sender_id,
        userType: req.body.sender_type,
        action: 'message_blocked',
        reason: JSON.parse(data).error,
        content: req.body.content?.substring(0, 100) // First 100 chars only
      };
      
      console.log('SECURITY_AUDIT:', JSON.stringify(logData));
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  chatRateLimit,
  validateContent,
  validateFile,
  verifyUserAccess,
  auditLog,
  encryptMessage,
  decryptMessage
};