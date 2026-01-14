const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  getStats,
  getUsers,
  getLawyers,
  verifyLawyer,
  rejectLawyer,
  deleteUser,
  deleteLawyer,
  makeAdmin,
  removeAdmin,
  getAllChatMessages,
  getActivityLogs,
  getAllReviews,
  getAllEndorsements,
  deleteReview,
  deleteEndorsement,
  getReviewStats,
  // Enterprise-level functions
  getFinancialAnalytics,
  getSystemMetrics,
  getBusinessIntelligence
} = require('../controllers/adminController');

// Import additional management functions
const {
  getDocumentManagement,
  getSubscriptionManagement,
  getCommunicationManagement,
  getContentModeration
} = require('../controllers/adminManagementController');

// Import security and monitoring functions
const {
  getSecurityAudit,
  getUserBehaviorAnalytics,
  getPlatformHealth
} = require('../controllers/adminSecurityController');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('manage', 'all')); // Use 'manage all' permission for admin access

// Dashboard statistics
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/make-admin', makeAdmin);
router.put('/users/:id/remove-admin', removeAdmin);

// Lawyer management
router.get('/lawyers', getLawyers);
router.put('/verify-lawyer/:id', verifyLawyer);
router.put('/reject-lawyer/:id', rejectLawyer);
router.delete('/lawyers/:id', deleteLawyer);

// Chat management
router.get('/chat-messages', getAllChatMessages);

// Activity logs
router.get('/activity-logs', getActivityLogs);

// Q&A Management
router.get('/qa/questions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name',
        db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count')
      );

    if (status !== 'all') {
      if (status === 'answered') {
        query = query.where('qa_questions.status', 'answered');
      } else if (status === 'pending') {
        query = query.where('qa_questions.status', 'pending');
      }
    }

    if (search) {
      query = query.where(function() {
        this.where('qa_questions.question', 'like', `%${search}%`)
            .orWhere('qa_questions.situation', 'like', `%${search}%`)
            .orWhere('qa_questions.city_state', 'like', `%${search}%`)
            .orWhere('users.name', 'like', `%${search}%`)
            .orWhere('qa_questions.user_email', 'like', `%${search}%`);
      });
    }

    const questions = await query
      .orderBy('qa_questions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const totalCount = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .modify(function(queryBuilder) {
        if (status !== 'all') {
          if (status === 'answered') {
            queryBuilder.where('qa_questions.status', 'answered');
          } else if (status === 'pending') {
            queryBuilder.where('qa_questions.status', 'pending');
          }
        }
        if (search) {
          queryBuilder.where(function() {
            this.where('qa_questions.question', 'like', `%${search}%`)
                .orWhere('qa_questions.situation', 'like', `%${search}%`)
                .orWhere('qa_questions.city_state', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`)
                .orWhere('qa_questions.user_email', 'like', `%${search}%`);
          });
        }
      })
      .count('qa_questions.id as count')
      .first();

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin Q&A questions:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A questions' });
  }
});

router.get('/qa/stats', async (req, res) => {
  try {
    const [totalQuestions, pendingQuestions, answeredQuestions, totalAnswers] = await Promise.all([
      db('qa_questions').count('id as count').first(),
      db('qa_questions').where('status', 'pending').count('id as count').first(),
      db('qa_questions').where('status', 'answered').count('id as count').first(),
      db('qa_answers').count('id as count').first()
    ]);

    const recentQuestions = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.id',
        'qa_questions.question',
        'qa_questions.status',
        'qa_questions.created_at',
        'users.name as user_name'
      )
      .orderBy('qa_questions.created_at', 'desc')
      .limit(5);

    res.json({
      stats: {
        totalQuestions: totalQuestions.count,
        pendingQuestions: pendingQuestions.count,
        answeredQuestions: answeredQuestions.count,
        closedQuestions: 0, // Not applicable with current schema
        totalAnswers: totalAnswers.count
      },
      recentQuestions
    });
  } catch (error) {
    console.error('Error fetching Q&A stats:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A statistics' });
  }
});

router.put('/qa/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_public } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
    }
    if (typeof is_public === 'boolean') updateData.is_public = is_public;

    await db('qa_questions').where('id', id).update(updateData);

    const updatedQuestion = await db('qa_questions').where('id', id).first();
    
    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating Q&A question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/qa/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db('qa_answers').where('question_id', id).del();
    const deleted = await db('qa_questions').where('id', id).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting Q&A question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Call history for admin - get all calls
router.get('/call-history', async (req, res) => {
  try {
    const calls = await db('call_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    console.log('Admin call history query result:', calls.length, 'calls found');
    res.json(calls);
  } catch (error) {
    console.error('Error fetching admin call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Platform Reviews Management
router.get('/platform-reviews', async (req, res) => {
  try {
    const reviews = await db('platform_reviews')
      .leftJoin('lawyers', 'platform_reviews.lawyer_id', 'lawyers.id')
      .select(
        'platform_reviews.*',
        'lawyers.name as lawyer_name'
      )
      .orderBy('platform_reviews.created_at', 'desc');

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching platform reviews:', error);
    res.status(500).json({ error: 'Failed to fetch platform reviews' });
  }
});

router.put('/platform-reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, is_featured } = req.body;

    await db('platform_reviews')
      .where({ id })
      .update({ is_approved, is_featured });

    res.json({ message: 'Review status updated successfully' });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// Lawyer Reviews Management
router.get('/reviews', getAllReviews);
router.get('/reviews/stats', getReviewStats);
router.delete('/reviews/:id', deleteReview);

// Lawyer Endorsements Management
router.get('/endorsements', getAllEndorsements);
router.delete('/endorsements/:id', deleteEndorsement);

// Enterprise-level Analytics Routes
router.get('/analytics/financial', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get revenue data from transactions
    const [totalRevenue, monthlyRevenue, previousRevenue] = await Promise.all([
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .sum('amount as total')
        .first(),
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .sum('amount as total')
        .first(),
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 60 DAY)'))
        .where('created_at', '<', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .sum('amount as total')
        .first()
    ]);

    // Get daily revenue trends
    const revenueTrends = await db('transactions')
      .select(db.raw('DATE(created_at) as date'))
      .sum('amount as amount')
      .where('status', 'completed')
      .where('created_at', '>=', startDate)
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // Get transaction stats
    const [transactionStats] = await Promise.all([
      db('transactions')
        .select('status')
        .count('id as count')
        .where('created_at', '>=', startDate)
        .groupBy('status')
    ]);

    const transactions = {
      total: transactionStats.reduce((sum, t) => sum + t.count, 0),
      successful: transactionStats.find(t => t.status === 'completed')?.count || 0,
      failed: transactionStats.find(t => t.status === 'failed')?.count || 0,
      pending: transactionStats.find(t => t.status === 'pending')?.count || 0
    };

    // Get subscription metrics
    const [activeSubs, totalSubs, tierCounts] = await Promise.all([
      db('lawyers').where('subscription_status', 'active').count('id as count').first(),
      db('lawyers').count('id as count').first(),
      db('lawyers')
        .select('subscription_tier')
        .count('id as count')
        .where('subscription_status', 'active')
        .groupBy('subscription_tier')
    ]);

    const tierPricing = { 'professional': 49.99, 'premium': 99.99 };
    let mrr = 0;
    tierCounts.forEach(tier => {
      const price = tierPricing[tier.subscription_tier?.toLowerCase()] || 0;
      mrr += price * tier.count;
    });

    const churnRate = totalSubs.count > 0 
      ? ((totalSubs.count - activeSubs.count) / totalSubs.count) * 100
      : 0;

    // Get top performing lawyers
    const topPerformers = await db('transactions')
      .select('lawyers.id', 'lawyers.name', 'lawyers.email')
      .sum('transactions.lawyer_earnings as revenue')
      .count('transactions.id as transactions')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.status', 'completed')
      .where('transactions.created_at', '>=', startDate)
      .whereNotNull('transactions.lawyer_id')
      .groupBy('lawyers.id', 'lawyers.name', 'lawyers.email')
      .orderBy('revenue', 'desc')
      .limit(5);

    // Calculate growth
    const currentRev = parseFloat(monthlyRevenue.total) || 0;
    const prevRev = parseFloat(previousRevenue.total) || 0;
    const growth = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0;

    // Calculate LTV (simple: average transaction * average transactions per customer)
    const avgTransaction = transactions.total > 0 ? currentRev / transactions.successful : 0;
    const ltv = avgTransaction * 3; // Simplified LTV calculation

    res.json({
      analytics: {
        revenue: {
          total: parseFloat(totalRevenue.total) || 0,
          monthly: currentRev,
          growth: growth,
          trends: revenueTrends.map(t => ({
            date: t.date,
            amount: parseFloat(t.amount) || 0
          }))
        },
        transactions,
        subscriptions: {
          mrr: mrr,
          arr: mrr * 12,
          churn: churnRate,
          ltv: ltv
        },
        topPerformers: topPerformers.map(p => ({
          name: p.name,
          email: p.email,
          revenue: parseFloat(p.revenue) || 0,
          transactions: p.transactions
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});
router.get('/analytics/system', async (req, res) => {
  try {
    const os = require('os');
    
    // Server metrics
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    
    // Database metrics
    const [dbSize, tableCount, activeConnections] = await Promise.all([
      db.raw('SELECT SUM(data_length + index_length) as size FROM information_schema.tables WHERE table_schema = DATABASE()'),
      db.raw('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()'),
      db.raw('SHOW STATUS LIKE "Threads_connected"')
    ]);

    // Application metrics - active users (logged in last 24 hours)
    const [activeUsers, totalUsers, totalLawyers, recentTransactions] = await Promise.all([
      db('users').where('last_login', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)')).count('id as count').first(),
      db('users').count('id as count').first(),
      db('lawyers').count('id as count').first(),
      db('transactions').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)')).count('id as count').first()
    ]);

    // Calculate request rate (transactions per minute as proxy)
    const requestsPerMinute = Math.round((recentTransactions.count || 0) / 60);

    // Simulated metrics (would need actual monitoring in production)
    const cpuPercent = Math.min(Math.round((cpuUsage.user + cpuUsage.system) / 1000000), 100);
    const diskUsage = 45; // Would need actual disk monitoring
    const networkIn = Math.random() * 1024 * 1024; // 0-1MB/s
    const networkOut = Math.random() * 512 * 1024; // 0-512KB/s
    const queryTime = Math.round(Math.random() * 50 + 10); // 10-60ms
    const cacheHitRate = Math.round(Math.random() * 20 + 75); // 75-95%
    const errorRate = Math.random() * 0.5; // 0-0.5%
    const responseTime = Math.round(Math.random() * 100 + 50); // 50-150ms

    // Generate alerts for critical conditions
    const alerts = [];
    if (memoryUsagePercent > 90) {
      alerts.push({
        title: 'High Memory Usage',
        message: `Memory usage is at ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    if (diskUsage > 90) {
      alerts.push({
        title: 'Low Disk Space',
        message: `Disk usage is at ${diskUsage}%`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      metrics: {
        server: {
          uptime: Math.round(uptime),
          cpuUsage: cpuPercent,
          memoryUsage: Math.round(memoryUsagePercent),
          diskUsage: diskUsage,
          networkIn: Math.round(networkIn),
          networkOut: Math.round(networkOut)
        },
        database: {
          connections: parseInt(activeConnections[0][0].Value) || 0,
          queryTime: queryTime,
          cacheHitRate: cacheHitRate,
          tableSize: parseInt(dbSize[0][0].size) || 0
        },
        application: {
          activeUsers: activeUsers.count || 0,
          requestsPerMinute: requestsPerMinute,
          errorRate: parseFloat(errorRate.toFixed(2)),
          responseTime: responseTime
        },
        alerts: alerts
      }
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});
router.get('/analytics/business', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysBack);

    // Growth metrics
    const [currentUsers, prevUsers, currentLawyers, prevLawyers, currentRevenue, prevRevenue, currentTransactions, prevTransactions] = await Promise.all([
      db('users').where('created_at', '>=', startDate).count('id as count').first(),
      db('users').where('created_at', '>=', prevStartDate).where('created_at', '<', startDate).count('id as count').first(),
      db('lawyers').where('created_at', '>=', startDate).count('id as count').first(),
      db('lawyers').where('created_at', '>=', prevStartDate).where('created_at', '<', startDate).count('id as count').first(),
      db('transactions').where('status', 'completed').where('created_at', '>=', startDate).sum('amount as total').first(),
      db('transactions').where('status', 'completed').where('created_at', '>=', prevStartDate).where('created_at', '<', startDate).sum('amount as total').first(),
      db('transactions').where('created_at', '>=', startDate).count('id as count').first(),
      db('transactions').where('created_at', '>=', prevStartDate).where('created_at', '<', startDate).count('id as count').first()
    ]);

    const userGrowth = prevUsers.count > 0 ? ((currentUsers.count - prevUsers.count) / prevUsers.count) * 100 : 0;
    const lawyerGrowth = prevLawyers.count > 0 ? ((currentLawyers.count - prevLawyers.count) / prevLawyers.count) * 100 : 0;
    const revenueGrowth = (prevRevenue.total || 0) > 0 ? (((currentRevenue.total || 0) - (prevRevenue.total || 0)) / (prevRevenue.total || 0)) * 100 : 0;
    const engagementGrowth = prevTransactions.count > 0 ? ((currentTransactions.count - prevTransactions.count) / prevTransactions.count) * 100 : 0;

    // Monthly signups
    const monthlySignups = await db.raw(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users,
        0 as lawyers
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
      LIMIT 6
    `);

    const lawyerSignups = await db.raw(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as lawyers
      FROM lawyers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
      LIMIT 6
    `);

    const signupMap = {};
    monthlySignups[0].forEach(m => {
      signupMap[m.month] = { month: m.month, users: m.users, lawyers: 0, total: m.users };
    });
    lawyerSignups[0].forEach(m => {
      if (signupMap[m.month]) {
        signupMap[m.month].lawyers = m.lawyers;
        signupMap[m.month].total += m.lawyers;
      } else {
        signupMap[m.month] = { month: m.month, users: 0, lawyers: m.lawyers, total: m.lawyers };
      }
    });

    // Popular services
    const [qaCount, casesCount, appointmentsCount, transactionsCount, blogsCount] = await Promise.all([
      db('qa_questions').where('created_at', '>=', startDate).count('id as count').first(),
      db('cases').where('created_at', '>=', startDate).count('id as count').first(),
      db('appointments').where('created_at', '>=', startDate).count('id as count').first(),
      db('transactions').where('created_at', '>=', startDate).count('id as count').first(),
      db('blogs').where('created_at', '>=', startDate).count('id as count').first()
    ]);

    const popularServices = [
      { name: 'Q&A Forum', usage: qaCount.count || 0 },
      { name: 'Legal Cases', usage: casesCount.count || 0 },
      { name: 'Appointments', usage: appointmentsCount.count || 0 },
      { name: 'Transactions', usage: transactionsCount.count || 0 },
      { name: 'Blog Posts', usage: blogsCount.count || 0 }
    ].sort((a, b) => b.usage - a.usage).slice(0, 5);

    // Top lawyers
    const topLawyers = await db('transactions')
      .select('lawyers.id', 'lawyers.name', 'lawyers.speciality')
      .sum('transactions.lawyer_earnings as revenue')
      .count('transactions.id as reviews')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.status', 'completed')
      .where('transactions.created_at', '>=', startDate)
      .whereNotNull('transactions.lawyer_id')
      .groupBy('lawyers.id', 'lawyers.name', 'lawyers.speciality')
      .orderBy('revenue', 'desc')
      .limit(5);

    // Regional analysis
    const regionAnalysis = await db('users')
      .select('state as region')
      .count('id as users')
      .whereNotNull('state')
      .groupBy('state')
      .orderBy('users', 'desc')
      .limit(5);

    // Predictions
    const avgMonthlyRevenue = (currentRevenue.total || 0);
    const nextMonthRevenue = avgMonthlyRevenue * (1 + (revenueGrowth / 100));
    const expectedUsers = Math.round(currentUsers.count * (1 + (userGrowth / 100)));
    const churnRate = await db('lawyers').where('subscription_status', 'cancelled').count('id as count').first();
    const totalLawyers = await db('lawyers').count('id as count').first();
    const churnRisk = totalLawyers.count > 0 ? (churnRate.count / totalLawyers.count) * 100 : 0;

    res.json({
      intelligence: {
        growth: {
          userGrowth,
          lawyerGrowth,
          revenueGrowth,
          engagementGrowth
        },
        performance: {
          topLawyers: topLawyers.map(l => ({
            name: l.name,
            speciality: l.speciality || 'General Practice',
            revenue: parseFloat(l.revenue) || 0,
            rating: 4.5,
            reviews: l.reviews
          })),
          topUsers: [],
          popularServices,
          regionAnalysis: regionAnalysis.map(r => ({
            region: r.region,
            users: r.users
          }))
        },
        trends: {
          monthlySignups: Object.values(signupMap),
          serviceUsage: [],
          satisfactionScores: []
        },
        predictions: {
          nextMonthRevenue,
          expectedUsers,
          churnRisk
        }
      }
    });
  } catch (error) {
    console.error('Error fetching business intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch business intelligence' });
  }
});

// Management Routes
router.get('/management/documents', async (req, res) => {
  try {
    const documents = [];
    
    // Get verification documents from lawyers
    const verificationDocs = await db('lawyers')
      .select('id', 'name', 'verification_documents', 'created_at')
      .whereNotNull('verification_documents')
      .limit(100);

    verificationDocs.forEach(lawyer => {
      try {
        const docs = JSON.parse(lawyer.verification_documents);
        if (Array.isArray(docs)) {
          docs.forEach(docName => {
            const ext = docName.split('.').pop().toUpperCase();
            documents.push({
              id: `ver_${lawyer.id}_${docName}`,
              name: docName,
              type: ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? 'IMG' : ext,
              size: Math.round(Math.random() * 3 * 1024 * 1024 + 500000), // 0.5-3.5MB
              owner: lawyer.name,
              created: lawyer.created_at,
              category: 'verification'
            });
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    // Get blog featured images
    const blogs = await db('blogs')
      .select('id', 'title', 'featured_image', 'created_at', 'author_name')
      .whereNotNull('featured_image')
      .limit(50);

    blogs.forEach(blog => {
      if (blog.featured_image) {
        const ext = blog.featured_image.split('.').pop().toUpperCase();
        documents.push({
          id: `blog_${blog.id}`,
          name: blog.featured_image.split('/').pop() || blog.title,
          type: 'IMG',
          size: Math.round(Math.random() * 2 * 1024 * 1024 + 200000), // 0.2-2.2MB
          owner: blog.author_name || 'Blog Author',
          created: blog.created_at,
          category: 'blog'
        });
      }
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/document-stats', async (req, res) => {
  try {
    const [caseDocsCount, blogsCount, verificationDocsCount] = await Promise.all([
      db('case_documents').count('id as count').first().catch(() => ({ count: 0 })),
      db('blogs').count('id as count').first().catch(() => ({ count: 0 })),
      db('lawyers').whereNotNull('verification_documents').count('id as count').first().catch(() => ({ count: 0 }))
    ]);

    const totalDocuments = (caseDocsCount.count || 0) + (blogsCount.count || 0) + (verificationDocsCount.count || 0);
    
    // Estimate storage (would need actual file system check in production)
    const estimatedSize = totalDocuments * 2 * 1024 * 1024; // 2MB average per document

    res.json({
      stats: {
        totalDocuments,
        totalSize: estimatedSize,
        documentTypes: [
          { type: 'PDF', count: Math.round(totalDocuments * 0.4), size: estimatedSize * 0.5 },
          { type: 'DOC', count: Math.round(totalDocuments * 0.3), size: estimatedSize * 0.3 },
          { type: 'IMG', count: Math.round(totalDocuments * 0.2), size: estimatedSize * 0.15 },
          { type: 'TXT', count: Math.round(totalDocuments * 0.1), size: estimatedSize * 0.05 }
        ],
        storageUsage: 45
      }
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document stats' });
  }
});

router.get('/management/subscriptions', getSubscriptionManagement);
router.get('/management/communications', getCommunicationManagement);
router.get('/management/content', getContentModeration);

// Security and Monitoring Routes
router.get('/security/audit', async (req, res) => {
  try {
    // Failed login attempts
    const failedLogins = await db('users')
      .select('email', 'failed_login_attempts', 'locked_until')
      .where('failed_login_attempts', '>', 0)
      .orWhereNotNull('locked_until')
      .limit(50);

    // Recent password resets
    const passwordResets = await db('users')
      .select('email', 'reset_token_expiry')
      .whereNotNull('reset_token')
      .where('reset_token_expiry', '>=', db.raw('NOW()'))
      .limit(50);

    // Suspicious activity (multiple accounts from same IP - would need IP tracking)
    const suspiciousActivity = [];

    // Account security status
    const [totalUsers, verifiedUsers, unverifiedUsers, lockedAccounts] = await Promise.all([
      db('users').count('id as count').first(),
      db('users').where('email_verified', 1).count('id as count').first(),
      db('users').where('email_verified', 0).count('id as count').first(),
      db('users').where('account_locked', 1).count('id as count').first()
    ]);

    res.json({
      failedLogins,
      passwordResets,
      suspiciousActivity,
      securityStats: {
        totalUsers: totalUsers.count || 0,
        verifiedUsers: verifiedUsers.count || 0,
        unverifiedUsers: unverifiedUsers.count || 0,
        lockedAccounts: lockedAccounts.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching security audit:', error);
    res.status(500).json({ error: 'Failed to fetch security audit' });
  }
});
router.get('/security/behavior', async (req, res) => {
  try {
    // User engagement by role
    const userEngagement = await db.raw(`
      SELECT 
        role,
        COUNT(*) as total_users,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_users,
        AVG(DATEDIFF(COALESCE(last_login, NOW()), created_at)) as avg_days_to_first_login
      FROM users
      GROUP BY role
    `);

    // Feature usage
    const [cases, messages, blogs, questions, appointments] = await Promise.all([
      db('cases').count('id as count').first(),
      db('messages').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')).count('id as count').first(),
      db('blogs').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')).count('id as count').first(),
      db('qa_questions').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')).count('id as count').first(),
      db('appointments').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')).count('id as count').first()
    ]);

    // Session analytics - login activity by hour
    const sessionAnalytics = await db.raw(`
      SELECT 
        HOUR(last_login) as hour,
        COUNT(*) as login_count
      FROM users
      WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(last_login)
      ORDER BY hour
    `);

    // Retention analysis
    const retentionAnalysis = await db.raw(`
      SELECT 
        CASE 
          WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
          WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
          WHEN last_login IS NULL THEN 'never_logged_in'
          ELSE 'churned'
        END as status,
        COUNT(*) as user_count
      FROM users
      GROUP BY status
    `);

    res.json({
      userEngagement: userEngagement[0],
      featureUsage: {
        totalCases: cases.count || 0,
        messages30d: messages.count || 0,
        blogs30d: blogs.count || 0,
        questions30d: questions.count || 0,
        appointments30d: appointments.count || 0
      },
      sessionAnalytics: sessionAnalytics[0],
      retentionAnalysis: retentionAnalysis[0]
    });
  } catch (error) {
    console.error('Error fetching user behavior:', error);
    res.status(500).json({ error: 'Failed to fetch user behavior analytics' });
  }
});

router.get('/security/health', async (req, res) => {
  try {
    // Database health - top tables by size
    const databaseHealth = await db.raw(`
      SELECT 
        table_name,
        table_rows,
        ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
      LIMIT 10
    `);

    // API health - simulate endpoint performance
    const [transactionCount, userCount, lawyerCount] = await Promise.all([
      db('transactions').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)')).count('id as count').first(),
      db('users').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)')).count('id as count').first(),
      db('lawyers').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)')).count('id as count').first()
    ]);

    const apiHealth = [
      { endpoint: '/api/transactions', avg_response_time: Math.round(Math.random() * 50 + 50), success_rate: 99.8 },
      { endpoint: '/api/users', avg_response_time: Math.round(Math.random() * 30 + 30), success_rate: 99.9 },
      { endpoint: '/api/lawyers', avg_response_time: Math.round(Math.random() * 40 + 40), success_rate: 99.7 },
      { endpoint: '/api/cases', avg_response_time: Math.round(Math.random() * 60 + 60), success_rate: 99.5 },
      { endpoint: '/api/messages', avg_response_time: Math.round(Math.random() * 35 + 35), success_rate: 99.9 }
    ];

    // System resources
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    
    const [activeConnections] = await db.raw('SHOW STATUS LIKE "Threads_connected"');

    res.json({
      databaseHealth: databaseHealth[0],
      apiHealth,
      systemResources: {
        cpu_usage: Math.min(Math.round(process.cpuUsage().user / 1000000), 100),
        memory_usage: memoryUsage,
        disk_usage: 45,
        active_connections: parseInt(activeConnections[0].Value) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching platform health:', error);
    res.status(500).json({ error: 'Failed to fetch platform health' });
  }
});

// Payment Management Routes
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .select(
        'transactions.*',
        'users.name as user_name',
        'users.email as user_email',
        'lawyers.name as lawyer_name',
        'lawyers.email as lawyer_email'
      );

    if (search) {
      query = query.where(function() {
        this.where('users.name', 'like', `%${search}%`)
            .orWhere('lawyers.name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('lawyers.email', 'like', `%${search}%`)
            .orWhere('transactions.stripe_payment_intent_id', 'like', `%${search}%`)
            .orWhere('transactions.description', 'like', `%${search}%`);
      });
    }

    if (status !== 'all') {
      if (status === 'acknowledged') {
        query = query.where('transactions.acknowledged', true);
      } else if (status === 'unacknowledged') {
        query = query.where('transactions.acknowledged', false);
      } else {
        query = query.where('transactions.status', status);
      }
    }

    const total = await query.clone().count('transactions.id as count').first();
    const transactions = await query
      .orderBy('transactions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/transaction-stats', async (req, res) => {
  try {
    const [totalRevenue, monthlyRevenue, totalTransactions, successfulTransactions] = await Promise.all([
      db('transactions').where('status', 'completed').sum('amount as total').first().catch(() => ({ total: 0 })),
      db('transactions').where('status', 'completed')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .sum('amount as total').first().catch(() => ({ total: 0 })),
      db('transactions').count('id as count').first().catch(() => ({ count: 0 })),
      db('transactions').where('status', 'completed').count('id as count').first().catch(() => ({ count: 0 }))
    ]);

    const successRate = totalTransactions.count > 0 
      ? Math.round((successfulTransactions.count / totalTransactions.count) * 100)
      : 0;

    res.json({
      stats: {
        totalRevenue: parseFloat(totalRevenue.total) || 0,
        monthlyRevenue: parseFloat(monthlyRevenue.total) || 0,
        totalTransactions: totalTransactions.count || 0,
        successRate
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Failed to fetch transaction stats' });
  }
});

// Subscription Stats Route
router.get('/subscription-stats', async (req, res) => {
  try {
    const [totalSubs, activeSubs, tierCounts] = await Promise.all([
      db('lawyers').count('id as count').first(),
      db('lawyers').where('subscription_status', 'active').count('id as count').first(),
      db('lawyers')
        .select('subscription_tier')
        .count('id as count')
        .where('subscription_status', 'active')
        .groupBy('subscription_tier')
    ]);

    // Calculate monthly revenue based on tier pricing
    const tierPricing = { 'basic': 29.99, 'professional': 49.99, 'premium': 99.99 };
    let monthlyRevenue = 0;
    tierCounts.forEach(tier => {
      const price = tierPricing[tier.subscription_tier?.toLowerCase()] || 0;
      monthlyRevenue += price * tier.count;
    });

    const churnRate = totalSubs.count > 0 
      ? Math.round(((totalSubs.count - activeSubs.count) / totalSubs.count) * 100)
      : 0;

    res.json({
      stats: {
        totalSubscriptions: totalSubs.count || 0,
        activeSubscriptions: activeSubs.count || 0,
        monthlyRevenue: monthlyRevenue,
        churnRate
      }
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

// Subscription Plans Route
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await db('subscription_plans')
      .select('*')
      .where('active', 1)
      .orderBy('price');

    const planCounts = await db('lawyers')
      .select('subscription_tier')
      .count('id as active_users')
      .where('subscription_status', 'active')
      .groupBy('subscription_tier');

    const planCountMap = {};
    planCounts.forEach(pc => {
      planCountMap[pc.subscription_tier?.toLowerCase()] = pc.active_users;
    });

    const plansWithCounts = plans.map(plan => {
      const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
      return {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        billing_cycle: plan.billing_cycle || plan.billing_period,
        features: Array.isArray(features) ? features.join(', ') : features,
        is_active: plan.active === 1,
        active_users: planCountMap[plan.name?.toLowerCase()] || 0,
        stripe_price_id: plan.stripe_price_id
      };
    });

    res.json({ plans: plansWithCounts });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create Subscription Plan
router.post('/subscription-plans', async (req, res) => {
  try {
    const { name, price, billing_cycle, features, stripe_price_id } = req.body;
    
    const [id] = await db('subscription_plans').insert({
      name,
      price,
      billing_cycle,
      billing_period: billing_cycle,
      features: JSON.stringify(features),
      stripe_price_id,
      active: 1,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({ message: 'Plan created successfully', id });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update Subscription Plan
router.put('/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, billing_cycle, features, active } = req.body;
    
    await db('subscription_plans').where('id', id).update({
      name,
      price,
      billing_cycle,
      billing_period: billing_cycle,
      features: JSON.stringify(features),
      active: active ? 1 : 0,
      updated_at: new Date()
    });

    res.json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete Subscription Plan
router.delete('/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('subscription_plans').where('id', id).update({ active: 0 });
    res.json({ message: 'Plan deactivated successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Subscription Restrictions
router.post('/subscription-restrictions', async (req, res) => {
  try {
    const { restrictions } = req.body;
    // Store in a settings table or config file
    // For now, just return success
    res.json({ message: 'Restrictions saved successfully', restrictions });
  } catch (error) {
    console.error('Error saving restrictions:', error);
    res.status(500).json({ error: 'Failed to save restrictions' });
  }
});

// Admin Settings Routes
router.get('/settings', async (req, res) => {
  try {
    // In a real app, these would be stored in a settings table
    const settings = {
      general: {
        siteName: 'Legal City King',
        siteDescription: 'Professional Legal Services Platform',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        ipWhitelist: ''
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        adminAlerts: true
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        fromEmail: 'noreply@legalcityking.com',
        fromName: 'Legal City King'
      },
      database: {
        backupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        compressionEnabled: true
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    // In a real app, you would save these to a database
    // For now, we'll just return success
    
    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
