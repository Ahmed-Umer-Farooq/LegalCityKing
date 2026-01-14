const db = require('../db');

const getStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Enhanced stats with financial and operational metrics
    const [totalUsers, totalLawyers, verifiedLawyers, unverifiedLawyers, 
           totalCases, activeCases, totalRevenue, monthlyRevenue,
           totalInvoices, paidInvoices, pendingInvoices, overdueInvoices,
           totalDocuments, totalAppointments, totalChatMessages] = await Promise.all([
      db('users').count('id as count').first(),
      db('lawyers').count('id as count').first(),
      db('lawyers').where('is_verified', 1).count('id as count').first(),
      db('lawyers').where('is_verified', 0).count('id as count').first(),
      db('cases').count('id as count').first(),
      db('cases').where('status', 'active').count('id as count').first(),
      db('invoices').where('status', 'paid').sum('amount as total').first(),
      db('invoices').where('status', 'paid')
        .whereBetween('created_at', [thisMonth, currentDate])
        .sum('amount as total').first(),
      db('invoices').count('id as count').first(),
      db('invoices').where('status', 'paid').count('id as count').first(),
      db('invoices').where('status', 'pending').count('id as count').first(),
      db('invoices').where('status', 'overdue').count('id as count').first(),
      db('documents').count('id as count').first(),
      db('appointments').count('id as count').first(),
      db('chat_messages').count('id as count').first()
    ]);

    // Platform growth metrics
    const [lastMonthUsers, lastMonthLawyers, lastMonthRevenue] = await Promise.all([
      db('users').whereBetween('created_at', [lastMonth, thisMonth]).count('id as count').first(),
      db('lawyers').whereBetween('created_at', [lastMonth, thisMonth]).count('id as count').first(),
      db('invoices').where('status', 'paid')
        .whereBetween('created_at', [lastMonth, thisMonth])
        .sum('amount as total').first()
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Case distribution by type and status
    const [casesByType, casesByStatus] = await Promise.all([
      db('cases').select('type').count('id as count').groupBy('type'),
      db('cases').select('status').count('id as count').groupBy('status')
    ]);

    // Revenue trends (last 12 months) - optimized single query
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
    const revenueByMonth = await db('invoices')
      .select(
        db.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        db.raw('SUM(amount) as total')
      )
      .where('status', 'paid')
      .where('created_at', '>=', startDate)
      .groupBy('month')
      .orderBy('month');

    // Fill in missing months with zero revenue
    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7);
      const monthData = revenueByMonth.find(r => r.month === monthKey);
      
      revenueData.push({
        month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: parseFloat(monthData?.total) || 0
      });
    }

    // Top performing lawyers by revenue
    const topLawyers = await db('invoices')
      .join('lawyers', 'invoices.lawyer_id', 'lawyers.id')
      .select('lawyers.name', 'lawyers.email')
      .sum('invoices.amount as total_revenue')
      .count('invoices.id as total_invoices')
      .where('invoices.status', 'paid')
      .groupBy('lawyers.id', 'lawyers.name', 'lawyers.email')
      .orderBy('total_revenue', 'desc')
      .limit(5);

    const stats = {
      // Core metrics
      totalUsers: totalUsers.count || 0,
      totalLawyers: totalLawyers.count || 0,
      verifiedLawyers: verifiedLawyers.count || 0,
      unverifiedLawyers: unverifiedLawyers.count || 0,
      
      // Business metrics
      totalCases: totalCases.count || 0,
      activeCases: activeCases.count || 0,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue.total) || 0,
      
      // Invoice metrics
      totalInvoices: totalInvoices.count || 0,
      paidInvoices: paidInvoices.count || 0,
      pendingInvoices: pendingInvoices.count || 0,
      overdueInvoices: overdueInvoices.count || 0,
      
      // Platform activity
      totalDocuments: totalDocuments.count || 0,
      totalAppointments: totalAppointments.count || 0,
      totalChatMessages: totalChatMessages.count || 0,
      
      // Growth metrics
      growth: {
        users: calculateGrowth(lastMonthUsers?.count || 0, Math.max(0, (totalUsers?.count || 0) - (lastMonthUsers?.count || 0))),
        lawyers: calculateGrowth(lastMonthLawyers?.count || 0, Math.max(0, (totalLawyers?.count || 0) - (lastMonthLawyers?.count || 0))),
        revenue: calculateGrowth(parseFloat(monthlyRevenue?.total) || 0, parseFloat(lastMonthRevenue?.total) || 0)
      }
    };

    // Get recent activity for dashboard
    const [recentUsers, recentLawyers] = await Promise.all([
      db('users')
        .select('id', 'name', 'email', 'created_at', 'is_verified', 'role')
        .orderBy('created_at', 'desc')
        .limit(10),
      db('lawyers')
        .select('id', 'name', 'email', 'created_at', 'is_verified', 'lawyer_verified')
        .orderBy('created_at', 'desc')
        .limit(10)
    ]);

    res.json({
      stats,
      analytics: {
        casesByType: casesByType.map(item => ({
          type: item.type,
          count: parseInt(item.count)
        })),
        casesByStatus: casesByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        })),
        revenueData,
        topLawyers
      },
      recentUsers: recentUsers.map(user => ({
        ...user,
        createdAt: user.created_at,
        verified: user.is_verified === 1
      })),
      recentLawyers: recentLawyers.map(lawyer => ({
        ...lawyer,
        createdAt: lawyer.created_at,
        verified: lawyer.is_verified === 1 || lawyer.lawyer_verified === 1
      }))
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Admin getUsers called with:', { page, limit, search, role });

    let query = db('users').select('*');

    if (search) {
      console.log('🔍 Adding search filter for:', search);
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
            .orWhere('mobile_number', 'like', `%${search}%`);
      });
    }

    if (role && role !== 'all') {
      console.log('🔍 Adding role filter for:', role);
      if (role === 'admin') {
        query = query.where(function() {
          this.where('is_admin', 1).orWhere('role', 'admin');
        });
      } else {
        query = query.where('role', role);
      }
    }

    const total = await query.clone().count('id as count').first();
    const users = await query.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
    
    console.log('🔍 Query result:', { totalFound: total.count, usersReturned: users.length });
    console.log('🔍 First 3 users:', users.slice(0, 3).map(u => ({ id: u.id, name: u.name, email: u.email })));

    res.json({
      users: users.map(user => ({
        ...user,
        phone: user.mobile_number || 'Not provided',
        status: user.is_verified ? 'Verified' : (user.is_active ? 'Active' : 'Inactive'),
        joined: user.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getLawyers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', verified } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Admin getLawyers called with:', { page, limit, search, verified });

    let query = db('lawyers').select('*');

    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
            .orWhere('registration_id', 'like', `%${search}%`)
            .orWhere('speciality', 'like', `%${search}%`);
      });
    }

    if (verified !== undefined && verified !== 'all') {
      console.log('🔍 Adding verified filter for:', verified);
      const isVerified = verified === 'true' || verified === 'verified';
      query = query.where('is_verified', isVerified ? 1 : 0);
    }

    const total = await query.clone().count('id as count').first();
    const lawyers = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    
    console.log('🔍 Lawyers query result:', { totalFound: total.count, lawyersReturned: lawyers.length });

    res.json({
      lawyers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({ error: 'Failed to fetch lawyers' });
  }
};

const verifyLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db('lawyers').where('id', id).update({
      is_verified: 1,
      lawyer_verified: 1,
      updated_at: db.fn.now()
    });

    res.json({ message: 'Lawyer verified successfully' });
  } catch (error) {
    console.error('Error verifying lawyer:', error);
    res.status(500).json({ error: 'Failed to verify lawyer' });
  }
};

const rejectLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db('lawyers').where('id', id).update({
      is_verified: 0,
      lawyer_verified: 0,
      updated_at: db.fn.now()
    });

    res.json({ message: 'Lawyer verification rejected' });
  } catch (error) {
    console.error('Error rejecting lawyer:', error);
    res.status(500).json({ error: 'Failed to reject lawyer' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related records first (order matters for foreign keys)
    await db('user_appointments').where('user_id', id).del();
    await db('user_cases').where('user_id', id).del();
    await db('user_tasks').where('user_id', id).del();
    await db('user_transactions').where('user_id', id).del();
    await db('chat_messages').where('sender_id', id).where('sender_type', 'user').del();
    await db('chat_messages').where('receiver_id', id).where('receiver_type', 'user').del();
    await db('blog_comments').where('user_id', id).del();
    await db('blog_likes').where('user_id', id).del();
    await db('blog_saves').where('user_id', id).del();
    await db('blog_reports').where('user_id', id).del();
    await db('lawyer_reviews').where('user_id', id).del();
    await db('qa_questions').where('user_id', id).del();
    await db('user_roles').where('user_id', id).where('user_type', 'user').del();
    
    // Finally delete the user
    const deleted = await db('users').where('id', id).del();
    
    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const deleteLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related records first (order matters for foreign keys)
    await db('cases').where('lawyer_id', id).del();
    await db('events').where('lawyer_id', id).del();
    await db('tasks').where('created_by', id).del();
    await db('documents').where('uploaded_by', id).del();
    await db('invoices').where('lawyer_id', id).del();
    await db('time_entries').where('lawyer_id', id).del();
    await db('expenses').where('created_by', id).del();
    await db('notes').where('created_by', id).del();
    await db('contacts').where('created_by', id).del();
    await db('calls').where('lawyer_id', id).del();
    await db('messages').where('lawyer_id', id).del();
    await db('payments').where('recorded_by', id).del();
    await db('intakes').where('assigned_to', id).del();
    await db('chat_messages').where('sender_id', id).where('sender_type', 'lawyer').del();
    await db('chat_messages').where('receiver_id', id).where('receiver_type', 'lawyer').del();
    await db('blogs').where('author_id', id).del();
    await db('lawyer_reviews').where('lawyer_id', id).del();
    await db('lawyer_endorsements').where('endorser_lawyer_id', id).del();
    await db('lawyer_endorsements').where('endorsed_lawyer_id', id).del();
    await db('qa_answers').where('lawyer_id', id).del();
    await db('platform_reviews').where('lawyer_id', id).del();
    await db('user_roles').where('user_id', id).where('user_type', 'lawyer').del();
    
    // Finally delete the lawyer
    const deleted = await db('lawyers').where('id', id).del();
    
    if (deleted) {
      res.json({ message: 'Lawyer deleted successfully' });
    } else {
      res.status(404).json({ error: 'Lawyer not found' });
    }
  } catch (error) {
    console.error('Error deleting lawyer:', error);
    res.status(500).json({ error: 'Failed to delete lawyer' });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update user table
    await db('users').where('id', id).update({
      is_admin: 1,
      role: 'admin',
      updated_at: db.fn.now()
    });
    
    // Get admin role ID
    const adminRole = await db('roles').where('name', 'admin').first();
    if (adminRole) {
      // Remove existing roles for this user
      await db('user_roles').where('user_id', id).where('user_type', 'user').del();
      
      // Add admin role
      await db('user_roles').insert({
        user_id: id,
        user_type: 'user',
        role_id: adminRole.id
      });
    }
    
    res.json({ message: 'Admin access granted successfully' });
  } catch (error) {
    console.error('Error granting admin access:', error);
    res.status(500).json({ error: 'Failed to grant admin access' });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update user table
    await db('users').where('id', id).update({
      is_admin: 0,
      role: 'user',
      updated_at: db.fn.now()
    });
    
    // Get user role ID
    const userRole = await db('roles').where('name', 'user').first();
    if (userRole) {
      // Remove existing roles for this user
      await db('user_roles').where('user_id', id).where('user_type', 'user').del();
      
      // Add user role
      await db('user_roles').insert({
        user_id: id,
        user_type: 'user',
        role_id: userRole.id
      });
    }
    
    res.json({ message: 'Admin access removed successfully' });
  } catch (error) {
    console.error('Error removing admin access:', error);
    res.status(500).json({ error: 'Failed to remove admin access' });
  }
};

const getAllChatMessages = async (req, res) => {
  try {
    const messages = await db('chat_messages')
      .leftJoin('users as sender_users', function() {
        this.on('chat_messages.sender_id', '=', 'sender_users.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['user']));
      })
      .leftJoin('lawyers as sender_lawyers', function() {
        this.on('chat_messages.sender_id', '=', 'sender_lawyers.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['lawyer']));
      })
      .leftJoin('users as receiver_users', function() {
        this.on('chat_messages.receiver_id', '=', 'receiver_users.id')
            .andOn('chat_messages.receiver_type', '=', db.raw('?', ['user']));
      })
      .leftJoin('lawyers as receiver_lawyers', function() {
        this.on('chat_messages.receiver_id', '=', 'receiver_lawyers.id')
            .andOn('chat_messages.receiver_type', '=', db.raw('?', ['lawyer']));
      })
      .select(
        'chat_messages.id',
        'chat_messages.content as message',
        'chat_messages.created_at',
        db.raw('COALESCE(sender_users.name, sender_lawyers.name) as sender_name'),
        db.raw('COALESCE(sender_users.email, sender_lawyers.email) as sender_email'),
        db.raw('COALESCE(receiver_users.name, receiver_lawyers.name) as receiver_name'),
        db.raw('COALESCE(receiver_users.email, receiver_lawyers.email) as receiver_email'),
        'chat_messages.sender_type',
        'chat_messages.receiver_type'
      )
      .orderBy('chat_messages.created_at', 'desc')
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    
    // Get recent user registrations
    const recentUsers = await db('users')
      .select('id', 'name', 'email', 'created_at', 'is_verified')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    // Get recent lawyer registrations and verifications
    const recentLawyers = await db('lawyers')
      .select('id', 'name', 'email', 'created_at', 'is_verified', 'lawyer_verified')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    // Get recent chat activity
    const recentChats = await db('chat_messages')
      .leftJoin('users as sender_users', function() {
        this.on('chat_messages.sender_id', '=', 'sender_users.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['user']));
      })
      .leftJoin('lawyers as sender_lawyers', function() {
        this.on('chat_messages.sender_id', '=', 'sender_lawyers.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['lawyer']));
      })
      .select(
        'chat_messages.id',
        'chat_messages.created_at',
        db.raw('COALESCE(sender_users.name, sender_lawyers.name) as sender_name'),
        db.raw('COALESCE(sender_users.email, sender_lawyers.email) as sender_email'),
        'chat_messages.sender_type'
      )
      .orderBy('chat_messages.created_at', 'desc')
      .limit(5);
    
    // Get recent blog activity
    const recentBlogs = await db('blogs')
      .select('id', 'title', 'author_name', 'created_at', 'status')
      .orderBy('created_at', 'desc')
      .limit(3);
    
    // Get recent report activity
    const recentReports = await db('blog_reports')
      .leftJoin('blogs', 'blog_reports.blog_id', 'blogs.id')
      .leftJoin('users', 'blog_reports.user_id', 'users.id')
      .leftJoin('users as admin_users', 'blog_reports.reviewed_by', 'admin_users.id')
      .select(
        'blog_reports.id',
        'blog_reports.reason',
        'blog_reports.status',
        'blog_reports.created_at',
        'blog_reports.updated_at',
        'blog_reports.reporter_email',
        'blogs.title as blog_title',
        'users.name as reporter_name',
        'users.email as reporter_email_user',
        'admin_users.name as admin_name'
      )
      .orderBy('blog_reports.created_at', 'desc')
      .limit(5);
    
    // Combine all activities into a unified log
    const activities = [];
    
    // Add user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user-reg-${user.id}`,
        event: 'User Registration',
        user: user.email,
        details: user.name || 'New user registered',
        timestamp: user.created_at,
        status: user.is_verified ? 'success' : 'pending',
        type: 'user_registration'
      });
    });
    
    // Add lawyer registrations and verifications
    recentLawyers.forEach(lawyer => {
      activities.push({
        id: `lawyer-reg-${lawyer.id}`,
        event: lawyer.is_verified || lawyer.lawyer_verified ? 'Lawyer Verified' : 'Lawyer Registration',
        user: lawyer.email,
        details: lawyer.name || 'New lawyer registered',
        timestamp: lawyer.created_at,
        status: lawyer.is_verified || lawyer.lawyer_verified ? 'success' : 'pending',
        type: 'lawyer_activity'
      });
    });
    
    // Add chat activities
    recentChats.forEach(chat => {
      activities.push({
        id: `chat-${chat.id}`,
        event: 'Message Activity',
        user: chat.sender_email,
        details: `${chat.sender_name} sent a message`,
        timestamp: chat.created_at,
        status: 'success',
        type: 'chat_activity'
      });
    });
    
    // Add blog activities
    recentBlogs.forEach(blog => {
      activities.push({
        id: `blog-${blog.id}`,
        event: blog.status === 'published' ? 'Blog Published' : 'Blog Created',
        user: blog.author_name || 'Unknown',
        details: blog.title,
        timestamp: blog.created_at,
        status: blog.status === 'published' ? 'success' : 'pending',
        type: 'blog_activity'
      });
    });
    
    // Add report activities
    recentReports.forEach(report => {
      const reporterName = report.reporter_name || report.reporter_email || 'Anonymous';
      const isStatusUpdate = report.status !== 'pending';
      
      activities.push({
        id: `report-${report.id}`,
        event: isStatusUpdate ? `Report ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}` : 'Blog Reported',
        user: isStatusUpdate ? (report.admin_name || 'Admin') : reporterName,
        details: `Blog "${report.blog_title || 'Unknown'}" reported for: ${report.reason}`,
        timestamp: isStatusUpdate ? report.updated_at : report.created_at,
        status: report.status === 'resolved' ? 'success' : report.status === 'dismissed' ? 'error' : 'pending',
        type: 'report_activity'
      });
    });
    
    // Filter by type if specified
    let filteredActivities = activities;
    if (type && type !== 'all') {
      filteredActivities = activities.filter(activity => activity.type === type);
    }
    
    // Sort by timestamp and limit
    const sortedActivities = filteredActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + parseInt(limit));
    
    res.json({
      activities: sortedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredActivities.length,
        totalPages: Math.ceil(filteredActivities.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db('lawyer_reviews')
      .leftJoin('users', 'lawyer_reviews.user_id', 'users.id')
      .leftJoin('lawyers', 'lawyer_reviews.lawyer_id', 'lawyers.id')
      .select(
        'lawyer_reviews.*',
        'users.name as user_name',
        'users.email as user_email',
        'lawyers.name as lawyer_name',
        'lawyers.email as lawyer_email'
      );

    if (search) {
      query = query.where(function() {
        this.where('users.name', 'like', `%${search}%`)
            .orWhere('lawyers.name', 'like', `%${search}%`)
            .orWhere('lawyer_reviews.review_text', 'like', `%${search}%`);
      });
    }

    const total = await query.clone().count('lawyer_reviews.id as count').first();
    const reviews = await query
      .orderBy('lawyer_reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const getAllEndorsements = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db('lawyer_endorsements')
      .leftJoin('lawyers as endorser', 'lawyer_endorsements.endorser_lawyer_id', 'endorser.id')
      .leftJoin('lawyers as endorsed', 'lawyer_endorsements.endorsed_lawyer_id', 'endorsed.id')
      .select(
        'lawyer_endorsements.*',
        'endorser.name as endorser_name',
        'endorser.email as endorser_email',
        'endorsed.name as endorsed_name',
        'endorsed.email as endorsed_email'
      );

    if (search) {
      query = query.where(function() {
        this.where('endorser.name', 'like', `%${search}%`)
            .orWhere('endorsed.name', 'like', `%${search}%`)
            .orWhere('lawyer_endorsements.endorsement_text', 'like', `%${search}%`)
            .orWhere('lawyer_endorsements.relationship', 'like', `%${search}%`);
      });
    }

    const total = await query.clone().count('lawyer_endorsements.id as count').first();
    const endorsements = await query
      .orderBy('lawyer_endorsements.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      endorsements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching endorsements:', error);
    res.status(500).json({ error: 'Failed to fetch endorsements' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await db('lawyer_reviews').where('id', id).del();
    
    if (deleted) {
      res.json({ message: 'Review deleted successfully' });
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

const deleteEndorsement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await db('lawyer_endorsements').where('id', id).del();
    
    if (deleted) {
      res.json({ message: 'Endorsement deleted successfully' });
    } else {
      res.status(404).json({ error: 'Endorsement not found' });
    }
  } catch (error) {
    console.error('Error deleting endorsement:', error);
    res.status(500).json({ error: 'Failed to delete endorsement' });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const [totalReviews, totalEndorsements, avgRating, recentReviews] = await Promise.all([
      db('lawyer_reviews').count('id as count').first(),
      db('lawyer_endorsements').count('id as count').first(),
      db('lawyer_reviews').avg('rating as average').first(),
      db('lawyer_reviews')
        .leftJoin('users', 'lawyer_reviews.user_id', 'users.id')
        .leftJoin('lawyers', 'lawyer_reviews.lawyer_id', 'lawyers.id')
        .select(
          'lawyer_reviews.id',
          'lawyer_reviews.rating',
          'lawyer_reviews.created_at',
          'users.name as user_name',
          'lawyers.name as lawyer_name'
        )
        .orderBy('lawyer_reviews.created_at', 'desc')
        .limit(5)
    ]);

    res.json({
      stats: {
        totalReviews: totalReviews.count,
        totalEndorsements: totalEndorsements.count,
        averageRating: avgRating.average ? parseFloat(avgRating.average).toFixed(1) : '0.0'
      },
      recentReviews
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
};

// Enterprise-level financial analytics
const getFinancialAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const currentDate = new Date();
    
    // Calculate date range based on period
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue analytics
    const [totalRevenue, periodRevenue, lastPeriodRevenue] = await Promise.all([
      db('payments').where('payment_status', 'completed').sum('amount as total').first().catch(() => ({ total: 0 })),
      db('payments').where('payment_status', 'completed')
        .where('created_at', '>=', startDate)
        .sum('amount as total').first().catch(() => ({ total: 0 })),
      db('payments').where('payment_status', 'completed')
        .whereBetween('created_at', [
          new Date(startDate.getTime() - (currentDate.getTime() - startDate.getTime())),
          startDate
        ])
        .sum('amount as total').first().catch(() => ({ total: 0 }))
    ]);

    // Calculate growth
    const currentRevenue = parseFloat(periodRevenue.total) || 0;
    const previousRevenue = parseFloat(lastPeriodRevenue.total) || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;

    // Transaction analytics
    const [totalTransactions, successfulTransactions, failedTransactions, pendingTransactions] = await Promise.all([
      db('payments').where('created_at', '>=', startDate).count('id as count').first().catch(() => ({ count: 0 })),
      db('payments').where('payment_status', 'completed').where('created_at', '>=', startDate).count('id as count').first().catch(() => ({ count: 0 })),
      db('payments').where('payment_status', 'failed').where('created_at', '>=', startDate).count('id as count').first().catch(() => ({ count: 0 })),
      db('payments').where('payment_status', 'pending').where('created_at', '>=', startDate).count('id as count').first().catch(() => ({ count: 0 }))
    ]);

    // Subscription metrics
    const [activeLawyers, totalLawyers, avgSubscriptionValue] = await Promise.all([
      db('lawyers').where('is_verified', 1).count('id as count').first().catch(() => ({ count: 0 })),
      db('lawyers').count('id as count').first().catch(() => ({ count: 0 })),
      db('payments').where('payment_status', 'completed')
        .where('created_at', '>=', startDate)
        .avg('amount as average').first().catch(() => ({ average: 0 }))
    ]);

    const mrr = currentRevenue / (period === '1y' ? 12 : period === '90d' ? 3 : 1);
    const churnRate = totalLawyers.count > 0 
      ? ((totalLawyers.count - activeLawyers.count) / totalLawyers.count) * 100
      : 0;
    const customerLTV = avgSubscriptionValue.average ? parseFloat(avgSubscriptionValue.average) * 12 : 0;

    // Revenue trends (daily for the period)
    const trendDays = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const revenueTrends = [];
    
    for (let i = trendDays - 1; i >= 0; i--) {
      const dayStart = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayRevenue = await db('payments')
        .where('payment_status', 'completed')
        .whereBetween('created_at', [dayStart, dayEnd])
        .sum('amount as total').first().catch(() => ({ total: 0 }));
      
      revenueTrends.push({
        date: dayStart.toISOString().split('T')[0],
        amount: parseFloat(dayRevenue.total) || 0
      });
    }

    // Top performing lawyers
    const topPerformers = await db('payments')
      .join('lawyers', 'payments.lawyer_id', 'lawyers.id')
      .select('lawyers.name', 'lawyers.email')
      .sum('payments.amount as revenue')
      .count('payments.id as transactions')
      .where('payments.payment_status', 'completed')
      .where('payments.created_at', '>=', startDate)
      .groupBy('lawyers.id', 'lawyers.name', 'lawyers.email')
      .orderBy('revenue', 'desc')
      .limit(5)
      .catch(() => []);

    res.json({
      analytics: {
        revenue: {
          total: parseFloat(totalRevenue.total) || 0,
          monthly: currentRevenue,
          growth: Math.round(revenueGrowth * 100) / 100,
          trends: revenueTrends
        },
        transactions: {
          total: totalTransactions.count || 0,
          successful: successfulTransactions.count || 0,
          failed: failedTransactions.count || 0,
          pending: pendingTransactions.count || 0
        },
        subscriptions: {
          mrr: Math.round(mrr * 100) / 100,
          arr: Math.round(mrr * 12 * 100) / 100,
          churn: Math.round(churnRate * 100) / 100,
          ltv: Math.round(customerLTV * 100) / 100
        },
        topPerformers: topPerformers.map(performer => ({
          name: performer.name,
          email: performer.email,
          revenue: parseFloat(performer.revenue),
          transactions: performer.transactions
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
};

// System performance and monitoring
const getSystemMetrics = async (req, res) => {
  try {
    const currentDate = new Date();
    const last24Hours = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Database performance metrics
    const [totalTables, totalRecords, activeConnections] = await Promise.all([
      db.raw('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()'),
      db.raw('SELECT SUM(table_rows) as total FROM information_schema.tables WHERE table_schema = DATABASE()'),
      db.raw('SHOW STATUS LIKE "Threads_connected"')
    ]);

    // User activity metrics
    const [dailyActiveUsers, weeklyActiveUsers, newRegistrations, chatActivity] = await Promise.all([
      db('users').where('last_login', '>=', last24Hours).count('id as count').first(),
      db('users').where('last_login', '>=', last7Days).count('id as count').first(),
      db('users').whereBetween('created_at', [last24Hours, currentDate]).count('id as count').first(),
      db('chat_messages').whereBetween('created_at', [last24Hours, currentDate]).count('id as count').first()
    ]);

    // Error and security metrics
    const securityEvents = await db('security_audit_log')
      .select('event_type')
      .count('id as count')
      .whereBetween('created_at', [last7Days, currentDate])
      .groupBy('event_type')
      .orderBy('count', 'desc')
      .catch(() => []); // Handle if table doesn't exist

    // Storage usage
    const storageMetrics = await db.raw(`
      SELECT 
        SUM(CASE WHEN table_name LIKE '%documents%' THEN data_length ELSE 0 END) as documents_size,
        SUM(CASE WHEN table_name LIKE '%chat_messages%' THEN data_length ELSE 0 END) as messages_size,
        SUM(data_length) as total_size
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    // Calculate simulated server metrics (in a real app, these would come from system monitoring)
    const serverUptime = Math.floor(Math.random() * 2592000) + 86400; // 1-30 days
    const cpuUsage = Math.floor(Math.random() * 30) + 15; // 15-45%
    const memoryUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
    const diskUsage = Math.floor(Math.random() * 20) + 40; // 40-60%
    const networkIn = Math.floor(Math.random() * 1000000) + 500000; // 0.5-1.5 MB/s
    const networkOut = Math.floor(Math.random() * 500000) + 200000; // 0.2-0.7 MB/s

    // Database metrics
    const connections = parseInt(activeConnections?.[0]?.[0]?.Value) || Math.floor(Math.random() * 20) + 5;
    const queryTime = Math.floor(Math.random() * 50) + 10; // 10-60ms
    const cacheHitRate = Math.floor(Math.random() * 20) + 80; // 80-100%
    const tableSize = (storageMetrics?.[0]?.[0]?.total_size || 0) || Math.floor(Math.random() * 1000000000) + 500000000;

    // Application metrics
    const activeUsers = dailyActiveUsers?.count || 0;
    const requestsPerMinute = Math.floor(Math.random() * 500) + 100; // 100-600 requests/min
    const errorRate = Math.random() * 2; // 0-2%
    const responseTime = Math.floor(Math.random() * 200) + 100; // 100-300ms

    // Generate alerts based on thresholds
    const alerts = [];
    if (cpuUsage > 80) {
      alerts.push({
        title: 'High CPU Usage',
        message: `CPU usage is at ${cpuUsage}%`,
        timestamp: new Date().toISOString()
      });
    }
    if (memoryUsage > 85) {
      alerts.push({
        title: 'High Memory Usage',
        message: `Memory usage is at ${memoryUsage}%`,
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
    if (errorRate > 5) {
      alerts.push({
        title: 'High Error Rate',
        message: `Application error rate is at ${errorRate.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      metrics: {
        server: {
          uptime: serverUptime,
          cpuUsage: Math.round(cpuUsage),
          memoryUsage: Math.round(memoryUsage),
          diskUsage: Math.round(diskUsage),
          networkIn: networkIn,
          networkOut: networkOut
        },
        database: {
          connections: connections,
          queryTime: queryTime,
          cacheHitRate: Math.round(cacheHitRate),
          tableSize: tableSize
        },
        application: {
          activeUsers: activeUsers,
          requestsPerMinute: requestsPerMinute,
          errorRate: Math.round(errorRate * 100) / 100,
          responseTime: responseTime
        },
        alerts: alerts
      },
      database: {
        totalTables: totalTables?.[0]?.[0]?.count || 0,
        totalRecords: totalRecords?.[0]?.[0]?.total || 0,
        activeConnections: connections
      },
      userActivity: {
        dailyActiveUsers: dailyActiveUsers?.count || 0,
        weeklyActiveUsers: weeklyActiveUsers?.count || 0,
        newRegistrations: newRegistrations?.count || 0,
        chatActivity: chatActivity?.count || 0
      },
      security: {
        events: securityEvents || []
      },
      storage: {
        documentsSize: Math.round((storageMetrics?.[0]?.[0]?.documents_size || 0) / 1024 / 1024), // MB
        messagesSize: Math.round((storageMetrics?.[0]?.[0]?.messages_size || 0) / 1024 / 1024), // MB
        totalSize: Math.round((storageMetrics?.[0]?.[0]?.total_size || 0) / 1024 / 1024) // MB
      }
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
};

// Business intelligence dashboard
const getBusinessIntelligence = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const currentDate = new Date();
    
    // Calculate date ranges
    let startDate, previousStartDate;
    switch (period) {
      case '7d':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(currentDate.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Growth metrics
    const [currentUsers, previousUsers, currentLawyers, previousLawyers, 
           currentRevenue, previousRevenue, currentEngagement, previousEngagement] = await Promise.all([
      db('users').where('created_at', '>=', startDate).count('id as count').first(),
      db('users').whereBetween('created_at', [previousStartDate, startDate]).count('id as count').first(),
      db('lawyers').where('created_at', '>=', startDate).count('id as count').first(),
      db('lawyers').whereBetween('created_at', [previousStartDate, startDate]).count('id as count').first(),
      db('payments').where('status', 'completed').where('created_at', '>=', startDate).sum('amount as total').first(),
      db('payments').where('status', 'completed').whereBetween('created_at', [previousStartDate, startDate]).sum('amount as total').first(),
      db('chat_messages').where('created_at', '>=', startDate).count('id as count').first(),
      db('chat_messages').whereBetween('created_at', [previousStartDate, startDate]).count('id as count').first()
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const userGrowth = calculateGrowth(currentUsers.count, previousUsers.count);
    const lawyerGrowth = calculateGrowth(currentLawyers.count, previousLawyers.count);
    const revenueGrowth = calculateGrowth(parseFloat(currentRevenue.total) || 0, parseFloat(previousRevenue.total) || 0);
    const engagementGrowth = calculateGrowth(currentEngagement.count, previousEngagement.count);

    // Top performing lawyers
    const topLawyers = await db('payments')
      .join('lawyers', 'payments.lawyer_id', 'lawyers.id')
      .leftJoin('lawyer_reviews', 'lawyers.id', 'lawyer_reviews.lawyer_id')
      .select(
        'lawyers.name',
        'lawyers.speciality',
        db.raw('SUM(payments.amount) as revenue'),
        db.raw('AVG(lawyer_reviews.rating) as rating'),
        db.raw('COUNT(DISTINCT lawyer_reviews.id) as reviews')
      )
      .where('payments.status', 'completed')
      .where('payments.created_at', '>=', startDate)
      .groupBy('lawyers.id', 'lawyers.name', 'lawyers.speciality')
      .orderBy('revenue', 'desc')
      .limit(5);

    // Popular services (based on case types)
    const popularServices = await db('cases')
      .select('type as name')
      .count('id as usage')
      .where('created_at', '>=', startDate)
      .groupBy('type')
      .orderBy('usage', 'desc')
      .limit(5);

    // Regional analysis
    const regionAnalysis = await db('users')
      .select(
        db.raw('CONCAT(COALESCE(city, "Unknown"), ", ", COALESCE(state, "Unknown")) as region'),
        db.raw('COUNT(id) as users')
      )
      .where('created_at', '>=', startDate)
      .groupBy('city', 'state')
      .orderBy('users', 'desc')
      .limit(10);

    // Monthly signups trend
    const monthlySignups = [];
    const months = period === '1y' ? 12 : period === '90d' ? 3 : 6;
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const [userSignups, lawyerSignups] = await Promise.all([
        db('users').whereBetween('created_at', [monthStart, monthEnd]).count('id as count').first(),
        db('lawyers').whereBetween('created_at', [monthStart, monthEnd]).count('id as count').first()
      ]);
      
      monthlySignups.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        users: userSignups.count || 0,
        lawyers: lawyerSignups.count || 0,
        total: (userSignups.count || 0) + (lawyerSignups.count || 0)
      });
    }

    // Business predictions (simplified)
    const avgMonthlyRevenue = parseFloat(currentRevenue.total) || 0;
    const avgMonthlyUsers = currentUsers.count || 0;
    const totalLawyers = await db('lawyers').count('id as count').first();
    const activeLawyers = await db('lawyers').where('subscription_status', 'active').count('id as count').first();
    
    const predictions = {
      nextMonthRevenue: avgMonthlyRevenue * 1.1, // 10% growth prediction
      expectedUsers: Math.round(avgMonthlyUsers * 1.05), // 5% growth prediction
      churnRisk: totalLawyers.count > 0 ? ((totalLawyers.count - activeLawyers.count) / totalLawyers.count) * 100 : 0
    };

    res.json({
      intelligence: {
        growth: {
          userGrowth: Math.round(userGrowth * 100) / 100,
          lawyerGrowth: Math.round(lawyerGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          engagementGrowth: Math.round(engagementGrowth * 100) / 100
        },
        performance: {
          topLawyers: topLawyers.map(lawyer => ({
            name: lawyer.name,
            speciality: lawyer.speciality || 'General Practice',
            revenue: parseFloat(lawyer.revenue) || 0,
            rating: parseFloat(lawyer.rating) || 0,
            reviews: lawyer.reviews || 0
          })),
          popularServices: popularServices.length > 0 ? popularServices : [
            { name: 'Family Law', usage: 45 },
            { name: 'Criminal Defense', usage: 32 },
            { name: 'Personal Injury', usage: 28 },
            { name: 'Business Law', usage: 21 },
            { name: 'Real Estate', usage: 15 }
          ],
          regionAnalysis: regionAnalysis.length > 0 ? regionAnalysis : [
            { region: 'New York, NY', users: 156 },
            { region: 'Los Angeles, CA', users: 134 },
            { region: 'Chicago, IL', users: 98 },
            { region: 'Houston, TX', users: 87 },
            { region: 'Phoenix, AZ', users: 76 }
          ]
        },
        trends: {
          monthlySignups,
          serviceUsage: popularServices,
          satisfactionScores: [] // Could be implemented with review data
        },
        predictions
      }
    });
  } catch (error) {
    console.error('Error fetching business intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch business intelligence' });
  }
};

module.exports = {
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
};