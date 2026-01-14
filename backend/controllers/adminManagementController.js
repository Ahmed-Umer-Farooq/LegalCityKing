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
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const tierPricing = {
      'basic': { price: 0, billing_cycle: 'free' },
      'free': { price: 0, billing_cycle: 'free' },
      'professional': { price: 49.99, billing_cycle: 'month' },
      'premium': { price: 99.99, billing_cycle: 'month' }
    };

    let query = db('lawyers')
      .select(
        'lawyers.id',
        'lawyers.name as user_name',
        'lawyers.email as user_email',
        'lawyers.subscription_tier as plan_name',
        'lawyers.subscription_status as status',
        'lawyers.subscription_created_at as start_date',
        'lawyers.subscription_expires_at as next_billing_date'
      );

    if (search) {
      query = query.where(function() {
        this.where('lawyers.name', 'like', `%${search}%`)
            .orWhere('lawyers.email', 'like', `%${search}%`)
            .orWhere('lawyers.subscription_tier', 'like', `%${search}%`);
      });
    }

    if (status !== 'all') {
      query = query.where('lawyers.subscription_status', status);
    }

    const total = await query.clone().count('lawyers.id as count').first();
    const lawyers = await query
      .orderBy('lawyers.subscription_created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const subscriptions = lawyers.map(lawyer => {
      const tier = lawyer.plan_name?.toLowerCase() || 'free';
      const pricing = tierPricing[tier] || tierPricing['free'];
      return {
        ...lawyer,
        amount: pricing.price,
        billing_cycle: pricing.billing_cycle
      };
    });

    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
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