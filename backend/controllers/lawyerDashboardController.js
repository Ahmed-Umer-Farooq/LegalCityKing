const db = require('../db');

const getDashboardStats = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get current month stats
    const [activeCases, totalClients, upcomingHearings] = await Promise.all([
      db('cases').where({ lawyer_id: lawyerId, status: 'active' }).count('id as count').first(),
      db('users')
        .leftJoin('cases', 'users.id', 'cases.client_id')
        .where(function() {
          this.where('cases.lawyer_id', lawyerId)
              .orWhere('users.created_by_lawyer', lawyerId);
        })
        .where('users.role', 'client')
        .countDistinct('users.id as count').first(),
      db('events').where('lawyer_id', lawyerId)
        .where('start_date_time', '>=', currentDate.toISOString())
        .count('id as count').first()
    ]);

    const monthlyRevenue = { total: 0 };

    // Get last month stats for comparison
    const [lastMonthCases, lastMonthClients] = await Promise.all([
      db('cases').where({ lawyer_id: lawyerId, status: 'active' })
        .whereBetween('created_at', [lastMonth, thisMonth])
        .count('id as count').first(),
      db('cases').where('lawyer_id', lawyerId)
        .whereBetween('created_at', [lastMonth, thisMonth])
        .countDistinct('client_id as count').first()
    ]);

    const lastMonthRevenue = { total: 0 };

    // Calculate percentage changes
    const calculatePercentage = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentActiveCases = parseInt(activeCases.count) || 0;
    const currentTotalClients = parseInt(totalClients.count) || 0;
    const currentMonthlyRevenue = parseFloat(monthlyRevenue.total) || 0;
    const currentUpcomingHearings = parseInt(upcomingHearings.count) || 0;

    const lastActiveCases = parseInt(lastMonthCases.count) || 0;
    const lastTotalClients = parseInt(lastMonthClients.count) || 0;
    const lastMonthlyRevenue = parseFloat(lastMonthRevenue.total) || 0;

    // Get case distribution by type
    const caseDistribution = await db('cases')
      .select('type')
      .count('id as count')
      .where('lawyer_id', lawyerId)
      .groupBy('type');

    // Monthly revenue data from transactions
    const currentYear = new Date().getFullYear();
    const monthlyRevenueData = [];
    
    for (let month = 0; month < 12; month++) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59);
      
      const result = await db('transactions')
        .where('lawyer_id', lawyerId)
        .whereBetween('created_at', [startDate, endDate])
        .sum('lawyer_earnings as total')
        .first();
      
      monthlyRevenueData.push({
        month: monthNames[month],
        revenue: parseFloat(result.total) || 0
      });
    }

    res.json({
      activeCases: currentActiveCases,
      totalClients: currentTotalClients,
      monthlyRevenue: currentMonthlyRevenue,
      upcomingHearings: currentUpcomingHearings,
      percentageChanges: {
        activeCases: calculatePercentage(currentActiveCases, lastActiveCases),
        totalClients: calculatePercentage(currentTotalClients, lastTotalClients),
        monthlyRevenue: calculatePercentage(currentMonthlyRevenue, lastMonthlyRevenue)
      },
      caseDistribution: caseDistribution.map(item => ({
        label: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Unknown',
        count: parseInt(item.count),
        type: item.type || 'unknown'
      })),
      monthlyRevenueData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCases = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const cases = await db('cases')
      .select('id', 'case_number', 'title', 'type', 'status', 'created_at', 'client_id', 'description', 'filing_date')
      .where('lawyer_id', lawyerId)
      .orderBy('created_at', 'desc');

    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCase = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { title, client, type, description } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    // Generate special case ID
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const caseCount = await db('cases').where('lawyer_id', lawyerId).count('id as count').first();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const caseNumber = `LC-${type.substring(0, 3).toUpperCase()}-${year}${month}-${String(parseInt(caseCount.count) + 1).padStart(3, '0')}-${randomSuffix}`;

    const [caseId] = await db('cases').insert({
      lawyer_id: lawyerId,
      title,
      type,
      case_number: caseNumber,
      description: description || '',
      status: 'active',
      filing_date: new Date().toISOString().split('T')[0]
    });

    const newCase = await db('cases').where('id', caseId).first();
    res.json({ message: 'Case created successfully', case: newCase });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClients = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { search } = req.query;
    
    // Get clients created by this lawyer or associated through cases
    let query = db('users')
      .select('users.*')
      .leftJoin('cases', 'users.id', 'cases.client_id')
      .where(function() {
        this.where('cases.lawyer_id', lawyerId)
            .orWhere('users.created_by_lawyer', lawyerId);
      })
      .where('users.role', 'client')
      .groupBy('users.id')
      .orderBy('users.created_at', 'desc')
      .limit(3);

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function() {
        this.whereRaw('users.name LIKE ?', [searchTerm])
            .orWhereRaw('users.email LIKE ?', [searchTerm]);
      });
    }

    const clients = await query;
    
    const processedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.mobile_number || client.phone,
      cases: 0 // Could add case count if needed
    }));

    res.json(processedClients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAppointments = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const appointments = await db('appointments')
      .select('id', 'title', 'client_name', 'date', 'type')
      .where('lawyer_id', lawyerId)
      .orderBy('date', 'asc');

    const processedAppointments = appointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      client_name: apt.client_name,
      date: apt.date,
      time: '10:00 AM', // Default time
      type: apt.type,
      status: 'scheduled'
    }));

    res.json(processedAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const documents = await db('documents')
      .select('id', 'filename as name', 'case_id', 'upload_date', 'file_path')
      .where('lawyer_id', lawyerId)
      .orderBy('upload_date', 'desc');

    const processedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      case_id: doc.case_id,
      uploaded_at: doc.upload_date,
      file_url: doc.file_path,
      file_size: '2.5 MB' // Default size
    }));

    res.json(processedDocuments);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getInvoices = async (req, res) => {
  try {
    // Invoices table deleted - return empty array
    res.json([]);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers')
      .select('*')
      .where('id', lawyerId)
      .first();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Determine verification status - only approved status counts as verified
    const isVerified = lawyer.verification_status === 'approved';
    
    // Check if subscription has expired
    const now = new Date();
    const isExpired = lawyer.subscription_expires_at && new Date(lawyer.subscription_expires_at) < now;
    
    // If expired, update status to free
    if (isExpired && lawyer.subscription_tier !== 'free') {
      await db('lawyers').where('id', lawyerId).update({
        subscription_tier: 'free',
        subscription_status: 'expired',
        stripe_subscription_id: null
      });
      
      lawyer.subscription_tier = 'free';
      lawyer.subscription_status = 'expired';
    }

    const daysUntilExpiry = lawyer.subscription_expires_at 
      ? Math.ceil((new Date(lawyer.subscription_expires_at) - now) / (1000 * 60 * 60 * 24))
      : null;
    
    res.json({
      ...lawyer,
      is_verified: isVerified,
      lawyer_verified: isVerified,
      verified: isVerified,
      subscription: {
        tier: lawyer.subscription_tier,
        status: lawyer.subscription_status,
        created_at: lawyer.subscription_created_at,
        expires_at: lawyer.subscription_expires_at,
        cancelled: lawyer.subscription_cancelled,
        cancelled_at: lawyer.subscription_cancelled_at,
        auto_renew: lawyer.auto_renew,
        days_until_expiry: daysUntilExpiry,
        is_expired: isExpired
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const currentDate = new Date();
    const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const events = await db('events')
      .select('id', 'title', 'start_date_time', 'event_type')
      .where('lawyer_id', lawyerId)
      .whereBetween('start_date_time', [currentDate.toISOString(), nextWeek.toISOString()])
      .orderBy('start_date_time', 'asc')
      .limit(5);

    const processedEvents = events.map(event => {
      const eventDate = new Date(event.start_date_time);
      return {
        id: event.id,
        title: event.title,
        date: eventDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        time: eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        type: event.event_type || 'meeting'
      };
    });

    res.json(processedEvents);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getCases,
  createCase,
  getClients,
  getAppointments,
  getDocuments,
  getInvoices,
  getProfile,
  getUpcomingEvents
};