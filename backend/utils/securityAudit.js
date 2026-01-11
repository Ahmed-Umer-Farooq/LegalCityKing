const fs = require('fs');
const path = require('path');

// Security audit logger
class SecurityAudit {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.securityLogFile = path.join(this.logDir, 'security.log');
    this.chatLogFile = path.join(this.logDir, 'chat_audit.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Log security events
  logSecurityEvent(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      ...event
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.securityLogFile, logLine);
      console.log('🔒 SECURITY EVENT:', logEntry);
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  // Log chat activities
  logChatActivity(activity) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'CHAT_AUDIT',
      ...activity
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.chatLogFile, logLine);
    } catch (error) {
      console.error('Failed to write chat audit log:', error);
    }
  }

  // Log blocked messages
  logBlockedMessage(data) {
    this.logSecurityEvent({
      type: 'MESSAGE_BLOCKED',
      userId: data.userId,
      userType: data.userType,
      reason: data.reason,
      code: data.code,
      content: data.content?.substring(0, 100), // First 100 chars only
      ip: data.ip,
      userAgent: data.userAgent
    });
  }

  // Log file uploads
  logFileUpload(data) {
    this.logChatActivity({
      type: 'FILE_UPLOAD',
      userId: data.userId,
      userType: data.userType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      scanResult: data.scanResult,
      ip: data.ip
    });
  }

  // Log suspicious activities
  logSuspiciousActivity(data) {
    this.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId: data.userId,
      userType: data.userType,
      activity: data.activity,
      details: data.details,
      ip: data.ip,
      userAgent: data.userAgent
    });
  }

  // Log rate limit violations
  logRateLimitViolation(data) {
    this.logSecurityEvent({
      type: 'RATE_LIMIT_VIOLATION',
      userId: data.userId,
      userType: data.userType,
      endpoint: data.endpoint,
      attempts: data.attempts,
      ip: data.ip,
      userAgent: data.userAgent
    });
  }

  // Get security logs for admin dashboard
  getSecurityLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.securityLogFile)) {
        return [];
      }
      
      const logs = fs.readFileSync(this.securityLogFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null)
        .reverse();
      
      return logs;
    } catch (error) {
      console.error('Failed to read security logs:', error);
      return [];
    }
  }

  // Get chat audit logs
  getChatAuditLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.chatLogFile)) {
        return [];
      }
      
      const logs = fs.readFileSync(this.chatLogFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null)
        .reverse();
      
      return logs;
    } catch (error) {
      console.error('Failed to read chat audit logs:', error);
      return [];
    }
  }

  // Clean old logs (keep last 30 days)
  cleanOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    [this.securityLogFile, this.chatLogFile].forEach(logFile => {
      try {
        if (!fs.existsSync(logFile)) return;
        
        const logs = fs.readFileSync(logFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(log => {
            if (!log || !log.timestamp) return false;
            return new Date(log.timestamp) > thirtyDaysAgo;
          })
          .map(log => JSON.stringify(log))
          .join('\n');
        
        fs.writeFileSync(logFile, logs + '\n');
      } catch (error) {
        console.error('Failed to clean old logs:', error);
      }
    });
  }
}

// Create singleton instance
const securityAudit = new SecurityAudit();

// Clean logs daily
setInterval(() => {
  securityAudit.cleanOldLogs();
}, 24 * 60 * 60 * 1000); // 24 hours

module.exports = securityAudit;