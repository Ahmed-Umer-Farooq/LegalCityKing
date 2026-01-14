const db = require('../db');

// Security audit and monitoring
const getSecurityAudit = async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const currentDate = new Date();
    let startDate;

    switch (timeframe) {
      case '24h':
        startDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Login attempts and security events
    const [loginAttempts, failedLogins, suspiciousActivity] = await Promise.all([
      // Simulated login attempts (implement actual logging)
      db('users')
        .select(
          db.raw('DATE(last_login) as date'),
          db.raw('COUNT(*) as successful_logins')
        )
        .whereNotNull('last_login')
        .whereBetween('last_login', [startDate, currentDate])
        .groupBy('date')
        .orderBy('date', 'desc'),

      // Failed login attempts (implement actual logging)
      db('security_audit_log')
        .select('*')
        .where('event_type', 'failed_login')
        .whereBetween('created_at', [startDate, currentDate])
        .orderBy('created_at', 'desc')
        .limit(50),

      // Suspicious activity patterns
      db('security_audit_log')
        .select('event_type', 'ip_address')
        .count('id as count')
        .whereBetween('created_at', [startDate, currentDate])
        .groupBy('event_type', 'ip_address')
        .having('count', '>', 10)
        .orderBy('count', 'desc')
    ]);

    // User access patterns
    const accessPatterns = await db('users')
      .select(
        'role',
        db.raw('COUNT(*) as user_count'),
        db.raw('AVG(TIMESTAMPDIFF(HOUR, last_login, NOW())) as avg_hours_since_login')
      )
      .whereNotNull('last_login')
      .groupBy('role');

    // Permission violations (implement actual tracking)
    const permissionViolations = await db('security_audit_log')
      .select('*')
      .where('event_type', 'permission_denied')
      .whereBetween('created_at', [startDate, currentDate])
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json({
      timeframe,
      loginAttempts,
      failedLogins,
      suspiciousActivity,
      accessPatterns,
      permissionViolations
    });
  } catch (error) {
    console.error('Error fetching security audit:', error);
    res.status(500).json({ error: 'Failed to fetch security audit data' });
  }
};

// User behavior analytics
const getUserBehaviorAnalytics = async (req, res) => {
  try {
    const currentDate = new Date();
    const last30Days = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User engagement metrics
    const [userEngagement, featureUsage, sessionAnalytics] = await Promise.all([
      db('users')
        .select(
          'role',
          db.raw('COUNT(*) as total_users'),
          db.raw('SUM(CASE WHEN last_login >= ? THEN 1 ELSE 0 END) as active_users', [last30Days]),
          db.raw('AVG(TIMESTAMPDIFF(DAY, created_at, COALESCE(last_login, NOW()))) as avg_days_to_first_login')
        )
        .groupBy('role'),

      // Feature usage tracking
      Promise.all([
        db('cases').count('id as total_cases').first(),
        db('chat_messages').whereBetween('created_at', [last30Days, currentDate]).count('id as messages_30d').first(),
        db('blogs').whereBetween('created_at', [last30Days, currentDate]).count('id as blogs_30d').first(),
        db('qa_questions').whereBetween('created_at', [last30Days, currentDate]).count('id as questions_30d').first(),
        db('appointments').whereBetween('created_at', [last30Days, currentDate]).count('id as appointments_30d').first()
      ]),

      // Session analytics (simulated - implement actual session tracking)
      db('users')
        .select(
          db.raw('HOUR(last_login) as hour'),
          db.raw('COUNT(*) as login_count')
        )
        .whereNotNull('last_login')
        .whereBetween('last_login', [last30Days, currentDate])
        .groupBy('hour')
        .orderBy('hour')
    ]);

    // User retention analysis
    const retentionAnalysis = await db('users')
      .select(
        db.raw('DATEDIFF(NOW(), created_at) as days_since_signup'),
        db.raw('CASE WHEN last_login IS NULL THEN "never_logged_in" WHEN DATEDIFF(NOW(), last_login) <= 7 THEN "active" WHEN DATEDIFF(NOW(), last_login) <= 30 THEN "inactive" ELSE "churned" END as status'),
        db.raw('COUNT(*) as user_count')
      )
      .groupBy('status')
      .orderBy('user_count', 'desc');

    res.json({
      userEngagement,
      featureUsage: {
        totalCases: featureUsage[0].total_cases || 0,
        messages30d: featureUsage[1].messages_30d || 0,
        blogs30d: featureUsage[2].blogs_30d || 0,
        questions30d: featureUsage[3].questions_30d || 0,
        appointments30d: featureUsage[4].appointments_30d || 0
      },
      sessionAnalytics,
      retentionAnalysis
    });
  } catch (error) {
    console.error('Error fetching user behavior analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user behavior analytics' });
  }
};

// Platform health monitoring
const getPlatformHealth = async (req, res) => {
  try {
    // Database health metrics
    const [dbHealth, apiHealth, errorRates] = await Promise.all([
      db.raw(`
        SELECT 
          table_name,
          table_rows,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY size_mb DESC
        LIMIT 10
      `),

      // API endpoint performance (simulated - implement actual monitoring)
      Promise.resolve([
        { endpoint: '/api/auth/login', avg_response_time: 150, success_rate: 99.2 },
        { endpoint: '/api/cases', avg_response_time: 200, success_rate: 98.8 },
        { endpoint: '/api/chat/messages', avg_response_time: 100, success_rate: 99.5 },
        { endpoint: '/api/lawyers', avg_response_time: 180, success_rate: 99.1 }
      ]),

      // Error rate analysis (implement actual error logging)
      db('security_audit_log')
        .select('event_type')
        .count('id as error_count')
        .where('event_type', 'like', '%error%')
        .whereBetween('created_at', [
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date()
        ])
        .groupBy('event_type')
        .orderBy('error_count', 'desc')
    ]);

    // System resource usage (simulated)
    const systemResources = {
      cpu_usage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory_usage: Math.floor(Math.random() * 40) + 40, // 40-80%
      disk_usage: Math.floor(Math.random() * 20) + 60, // 60-80%
      active_connections: Math.floor(Math.random() * 50) + 100 // 100-150
    };

    // Service status
    const serviceStatus = [
      { service: 'Database', status: 'healthy', uptime: '99.9%' },
      { service: 'Authentication', status: 'healthy', uptime: '99.8%' },
      { service: 'File Storage', status: 'healthy', uptime: '99.7%' },
      { service: 'Email Service', status: 'healthy', uptime: '99.5%' },
      { service: 'Payment Gateway', status: 'healthy', uptime: '99.9%' }
    ];

    res.json({
      databaseHealth: dbHealth[0],
      apiHealth,
      errorRates,
      systemResources,
      serviceStatus
    });
  } catch (error) {
    console.error('Error fetching platform health:', error);
    res.status(500).json({ error: 'Failed to fetch platform health data' });
  }
};

module.exports = {
  getSecurityAudit,
  getUserBehaviorAnalytics,
  getPlatformHealth
};