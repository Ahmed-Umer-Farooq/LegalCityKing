const express = require('express');
const router = express.Router();
const securityAudit = require('../utils/securityAudit');
const { authenticateToken } = require('../utils/middleware');

// Security dashboard - get security events
router.get('/security/events', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { limit = 100, type } = req.query;
    let logs = securityAudit.getSecurityLogs(parseInt(limit));
    
    // Filter by event type if specified
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    res.json({
      events: logs,
      summary: {
        total: logs.length,
        types: [...new Set(logs.map(log => log.type))],
        recentCount: logs.filter(log => {
          const eventTime = new Date(log.timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return eventTime > oneHourAgo;
        }).length
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Chat audit logs
router.get('/security/chat-audit', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { limit = 100 } = req.query;
    const logs = securityAudit.getChatAuditLogs(parseInt(limit));
    
    res.json({
      activities: logs,
      summary: {
        total: logs.length,
        fileUploads: logs.filter(log => log.type === 'FILE_UPLOAD').length,
        messagesBlocked: logs.filter(log => log.type === 'MESSAGE_BLOCKED').length
      }
    });
  } catch (error) {
    console.error('Error fetching chat audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch chat audit logs' });
  }
});

// Security statistics
router.get('/security/stats', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const securityLogs = securityAudit.getSecurityLogs(1000);
    const chatLogs = securityAudit.getChatAuditLogs(1000);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      security: {
        totalEvents: securityLogs.length,
        last24h: securityLogs.filter(log => new Date(log.timestamp) > oneDayAgo).length,
        lastWeek: securityLogs.filter(log => new Date(log.timestamp) > oneWeekAgo).length,
        byType: securityLogs.reduce((acc, log) => {
          acc[log.type] = (acc[log.type] || 0) + 1;
          return acc;
        }, {})
      },
      chat: {
        totalActivities: chatLogs.length,
        fileUploads: chatLogs.filter(log => log.type === 'FILE_UPLOAD').length,
        blockedFiles: chatLogs.filter(log => 
          log.type === 'FILE_UPLOAD' && !log.scanResult?.safe
        ).length
      },
      threats: {
        spamDetected: securityLogs.filter(log => log.code === 'SPAM_DETECTED').length,
        maliciousLinks: securityLogs.filter(log => log.code === 'MALICIOUS_LINK').length,
        suspiciousFiles: securityLogs.filter(log => log.code === 'MALICIOUS_SIGNATURE').length,
        rateLimitViolations: securityLogs.filter(log => log.type === 'RATE_LIMIT_VIOLATION').length
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

// Block user (emergency action)
router.post('/security/block-user', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { userId, userType, reason } = req.body;
    const db = req.app.get('db');
    
    // Update user status to blocked
    const table = userType === 'lawyer' ? 'lawyers' : 'users';
    await db(table).where('id', userId).update({ 
      status: 'blocked',
      blocked_reason: reason,
      blocked_at: new Date()
    });
    
    // Log the action
    securityAudit.logSecurityEvent({
      type: 'USER_BLOCKED',
      adminId: req.user.id,
      targetUserId: userId,
      targetUserType: userType,
      reason: reason
    });
    
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Get quarantined files
router.get('/security/quarantine', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const fs = require('fs');
    const path = require('path');
    const quarantineDir = path.join(__dirname, '../quarantine');
    
    if (!fs.existsSync(quarantineDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(quarantineDir).map(filename => {
      const filePath = path.join(quarantineDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        quarantinedAt: stats.ctime,
        originalName: filename.split('_').slice(1).join('_') // Remove timestamp prefix
      };
    });
    
    res.json({ files });
  } catch (error) {
    console.error('Error fetching quarantined files:', error);
    res.status(500).json({ error: 'Failed to fetch quarantined files' });
  }
});

module.exports = router;