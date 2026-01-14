const db = require('../db');

// Document management for admin
const getDocumentManagement = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', type = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Document statistics
    const [totalDocs, totalSize, docsByType] = await Promise.all([
      db('documents').count('id as count').first(),
      db('documents').sum('file_size as total').first(),
      db('documents').select('file_type').count('id as count').groupBy('file_type')
    ]);

    // Recent documents with lawyer and case info
    let query = db('documents')
      .leftJoin('lawyers', 'documents.uploaded_by', 'lawyers.id')
      .leftJoin('cases', 'documents.case_id', 'cases.id')
      .select(
        'documents.*',
        'lawyers.name as lawyer_name',
        'cases.title as case_title'
      );

    if (search) {
      query = query.where(function() {
        this.where('documents.file_name', 'like', `%${search}%`)
            .orWhere('lawyers.name', 'like', `%${search}%`)
            .orWhere('cases.title', 'like', `%${search}%`);
      });
    }

    if (type !== 'all') {
      query = query.where('documents.file_type', type);
    }

    const total = await query.clone().count('documents.id as count').first();
    const documents = await query
      .orderBy('documents.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      stats: {
        totalDocuments: totalDocs.count || 0,
        totalSize: Math.round((totalSize.total || 0) / 1024 / 1024), // MB
        documentsByType: docsByType
      },
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching document management:', error);
    res.status(500).json({ error: 'Failed to fetch document management data' });
  }
};

// Subscription and billing management
const getSubscriptionManagement = async (req, res) => {
  try {
    // Subscription overview
    const [subscriptionStats, revenueByTier, churnAnalysis] = await Promise.all([
      db('lawyers')
        .select('subscription_tier', 'subscription_status')
        .count('id as count')
        .groupBy('subscription_tier', 'subscription_status'),
      
      db('lawyers')
        .leftJoin('invoices', 'lawyers.id', 'invoices.lawyer_id')
        .select('lawyers.subscription_tier')
        .sum('invoices.amount as total_revenue')
        .count('invoices.id as invoice_count')
        .where('invoices.status', 'paid')
        .groupBy('lawyers.subscription_tier'),
      
      db('lawyers')
        .select(
          db.raw('DATE_FORMAT(subscription_cancelled_at, "%Y-%m") as month'),
          db.raw('COUNT(*) as churned_count')
        )
        .where('subscription_status', 'cancelled')
        .whereNotNull('subscription_cancelled_at')
        .groupBy('month')
        .orderBy('month', 'desc')
        .limit(12)
    ]);

    // Upcoming renewals and expirations
    const upcomingRenewals = await db('lawyers')
      .select('id', 'name', 'email', 'subscription_tier', 'subscription_expires_at')
      .where('subscription_status', 'active')
      .where('subscription_expires_at', '<=', db.raw('DATE_ADD(NOW(), INTERVAL 30 DAY)'))
      .orderBy('subscription_expires_at', 'asc')
      .limit(20);

    // Payment failures and issues
    const paymentIssues = await db('invoices')
      .leftJoin('lawyers', 'invoices.lawyer_id', 'lawyers.id')
      .select('invoices.*', 'lawyers.name as lawyer_name', 'lawyers.email')
      .whereIn('invoices.status', ['failed', 'overdue'])
      .orderBy('invoices.due_date', 'asc')
      .limit(20);

    res.json({
      subscriptionStats,
      revenueByTier,
      churnAnalysis,
      upcomingRenewals,
      paymentIssues
    });
  } catch (error) {
    console.error('Error fetching subscription management:', error);
    res.status(500).json({ error: 'Failed to fetch subscription management data' });
  }
};

// Communication and messaging oversight
const getCommunicationManagement = async (req, res) => {
  try {
    const currentDate = new Date();
    const last30Days = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Message statistics
    const [messageStats, topCommunicators, flaggedMessages] = await Promise.all([
      db('chat_messages')
        .select(
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as message_count'),
          db.raw('COUNT(DISTINCT sender_id) as active_senders')
        )
        .whereBetween('created_at', [last30Days, currentDate])
        .groupBy('date')
        .orderBy('date', 'desc'),

      db('chat_messages')
        .leftJoin('users as sender_users', function() {
          this.on('chat_messages.sender_id', '=', 'sender_users.id')
              .andOn('chat_messages.sender_type', '=', db.raw('?', ['user']));
        })
        .leftJoin('lawyers as sender_lawyers', function() {
          this.on('chat_messages.sender_id', '=', 'sender_lawyers.id')
              .andOn('chat_messages.sender_type', '=', db.raw('?', ['lawyer']));
        })
        .select(
          'chat_messages.sender_id',
          'chat_messages.sender_type',
          db.raw('COALESCE(sender_users.name, sender_lawyers.name) as sender_name'),
          db.raw('COUNT(*) as message_count')
        )
        .whereBetween('chat_messages.created_at', [last30Days, currentDate])
        .groupBy('chat_messages.sender_id', 'chat_messages.sender_type')
        .orderBy('message_count', 'desc')
        .limit(10),

      // Simulated flagged messages (you can implement actual flagging logic)
      db('chat_messages')
        .leftJoin('users as sender_users', function() {
          this.on('chat_messages.sender_id', '=', 'sender_users.id')
              .andOn('chat_messages.sender_type', '=', db.raw('?', ['user']));
        })
        .leftJoin('lawyers as sender_lawyers', function() {
          this.on('chat_messages.sender_id', '=', 'sender_lawyers.id')
              .andOn('chat_messages.sender_type', '=', db.raw('?', ['lawyer']));
        })
        .select(
          'chat_messages.*',
          db.raw('COALESCE(sender_users.name, sender_lawyers.name) as sender_name')
        )
        .where('chat_messages.content', 'like', '%urgent%')
        .orWhere('chat_messages.content', 'like', '%complaint%')
        .orderBy('chat_messages.created_at', 'desc')
        .limit(10)
    ]);

    res.json({
      messageStats,
      topCommunicators,
      flaggedMessages
    });
  } catch (error) {
    console.error('Error fetching communication management:', error);
    res.status(500).json({ error: 'Failed to fetch communication management data' });
  }
};

// Content moderation and management
const getContentModeration = async (req, res) => {
  try {
    // Blog moderation
    const [blogStats, reportedBlogs, qaModeration] = await Promise.all([
      db('blogs')
        .select('status')
        .count('id as count')
        .groupBy('status'),

      db('blog_reports')
        .leftJoin('blogs', 'blog_reports.blog_id', 'blogs.id')
        .leftJoin('lawyers', 'blogs.author_id', 'lawyers.id')
        .select(
          'blog_reports.*',
          'blogs.title as blog_title',
          'lawyers.name as author_name'
        )
        .where('blog_reports.status', 'pending')
        .orderBy('blog_reports.created_at', 'desc')
        .limit(20),

      db('qa_questions')
        .select('status')
        .count('id as count')
        .groupBy('status')
    ]);

    // Recent content activity
    const recentActivity = await db('blogs')
      .leftJoin('lawyers', 'blogs.author_id', 'lawyers.id')
      .select(
        'blogs.id',
        'blogs.title',
        'blogs.status',
        'blogs.created_at',
        'lawyers.name as author_name'
      )
      .orderBy('blogs.created_at', 'desc')
      .limit(15);

    res.json({
      blogStats,
      reportedBlogs,
      qaModeration,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching content moderation:', error);
    res.status(500).json({ error: 'Failed to fetch content moderation data' });
  }
};

module.exports = {
  getDocumentManagement,
  getSubscriptionManagement,
  getCommunicationManagement,
  getContentModeration
};