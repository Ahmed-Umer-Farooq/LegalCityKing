const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Known malicious file signatures (hex patterns)
const maliciousSignatures = [
  '4d5a', // PE executable
  '504b0304', // ZIP file (potential malware container)
  '377abcaf271c', // 7-Zip
  'd0cf11e0a1b11ae1', // Microsoft Office (macro viruses)
];

// Legitimate file signatures that should be allowed
const legitimateSignatures = [
  '89504e47', // PNG
  'ffd8ffe0', // JPEG
  'ffd8ffe1', // JPEG (EXIF)
  'ffd8ffe2', // JPEG (Canon)
  'ffd8ffe8', // JPEG (SPIFF)
  '25504446', // PDF
  '474946383761', // GIF87a
  '474946383961', // GIF89a
  '52494646', // WEBP (RIFF header)
];

// Suspicious file content patterns
const suspiciousPatterns = [
  /eval\s*\(/gi, // JavaScript eval
  /document\.write/gi, // Document manipulation
  /window\.location/gi, // Redirect attempts
  /base64_decode/gi, // Base64 decoding
  /shell_exec|system|exec/gi, // System commands
  /\$_GET\[|\$_POST\[/gi, // PHP injection
  /<script[^>]*>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
];

// File entropy calculation (high entropy = potential encryption/packing)
const calculateEntropy = (buffer) => {
  const frequencies = new Array(256).fill(0);
  
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }
  
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / buffer.length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
};

// Scan file for malicious content
const scanFile = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const fileSize = buffer.length;
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Check file signature
    const signature = buffer.slice(0, 8).toString('hex').toLowerCase();
    
    // First check if it's a legitimate file type
    let isLegitimate = false;
    for (const legitSignature of legitimateSignatures) {
      if (signature.startsWith(legitSignature.toLowerCase())) {
        isLegitimate = true;
        break;
      }
    }
    
    // Only check for malicious signatures if it's not a known legitimate type
    if (!isLegitimate) {
      for (const maliciousSignature of maliciousSignatures) {
        if (signature.startsWith(maliciousSignature)) {
          return {
            safe: false,
            reason: 'Suspicious file signature detected',
            code: 'MALICIOUS_SIGNATURE',
            hash: fileHash
          };
        }
      }
    }
    
    // Check file entropy (packed/encrypted files)
    // Skip entropy check for legitimate image and document formats
    const entropy = calculateEntropy(buffer);
    if (!isLegitimate && entropy > 7.5) {
      return {
        safe: false,
        reason: 'High entropy detected (potential packing/encryption)',
        code: 'HIGH_ENTROPY',
        entropy: entropy.toFixed(2)
      };
    }
    
    // Check file content for suspicious patterns
    const content = buffer.toString('utf8', 0, Math.min(fileSize, 10000)); // First 10KB
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: 'Suspicious code pattern detected',
          code: 'SUSPICIOUS_PATTERN',
          pattern: pattern.source
        };
      }
    }
    
    // Check for embedded executables (skip for legitimate image/document formats)
    if (!isLegitimate && buffer.includes(Buffer.from('4d5a', 'hex'))) {
      return {
        safe: false,
        reason: 'Embedded executable detected',
        code: 'EMBEDDED_EXECUTABLE'
      };
    }
    
    // File size validation
    if (fileSize > 50 * 1024 * 1024) { // 50MB
      return {
        safe: false,
        reason: 'File too large',
        code: 'FILE_TOO_LARGE'
      };
    }
    
    return {
      safe: true,
      hash: fileHash,
      size: fileSize,
      entropy: entropy.toFixed(2)
    };
    
  } catch (error) {
    return {
      safe: false,
      reason: 'File scan error',
      code: 'SCAN_ERROR',
      error: error.message
    };
  }
};

// Quarantine malicious files
const quarantineFile = async (filePath, reason) => {
  const quarantineDir = path.join(__dirname, '../quarantine');
  
  if (!fs.existsSync(quarantineDir)) {
    fs.mkdirSync(quarantineDir, { recursive: true });
  }
  
  const fileName = path.basename(filePath);
  const timestamp = Date.now();
  const quarantinePath = path.join(quarantineDir, `${timestamp}_${fileName}`);
  
  try {
    fs.renameSync(filePath, quarantinePath);
    
    // Log quarantine action
    const logEntry = {
      timestamp: new Date().toISOString(),
      originalPath: filePath,
      quarantinePath: quarantinePath,
      reason: reason,
      action: 'QUARANTINED'
    };
    
    console.log('FILE_QUARANTINED:', JSON.stringify(logEntry));
    
    return quarantinePath;
  } catch (error) {
    console.error('Quarantine failed:', error);
    return null;
  }
};

// Release file from quarantine
const releaseFromQuarantine = async (quarantinePath, originalPath) => {
  try {
    if (fs.existsSync(quarantinePath)) {
      fs.renameSync(quarantinePath, originalPath);
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        quarantinePath: quarantinePath,
        releasedPath: originalPath,
        action: 'RELEASED'
      };
      
      console.log('FILE_RELEASED:', JSON.stringify(logEntry));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Release from quarantine failed:', error);
    return false;
  }
};

module.exports = {
  scanFile,
  quarantineFile,
  releaseFromQuarantine,
  calculateEntropy
};