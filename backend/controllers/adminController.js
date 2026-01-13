const db = require('../db');

const getStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await db('users').count('id as count').first();
    const totalLawyers = await db('lawyers').count('id as count').first();
    const verifiedLawyers = await db('lawyers').where('is_verified', 1).count('id as count').first();
    const unverifiedLawyers = await db('lawyers').where('is_verified', 0).count('id as count').first();

    // Get recent users (last 10)
    const recentUsers = await db('users')
      .select('id', 'name', 'email', 'created_at', 'is_verified', 'role')
      .orderBy('created_at', 'desc')
      .limit(10);

    // Get recent lawyers (last 10)
    const recentLawyers = await db('lawyers')
      .select('id', 'name', 'email', 'created_at', 'is_verified', 'lawyer_verified')
      .orderBy('created_at', 'desc')
      .limit(10);

    const stats = {
      totalUsers: totalUsers.count || 0,
      totalLawyers: totalLawyers.count || 0,
      verifiedLawyers: verifiedLawyers.count || 0,
      unverifiedLawyers: unverifiedLawyers.count || 0
    };

    res.json({
      stats,
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
  getReviewStats
};