const db = require('../db');

const getOverview = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Active cases count
    const activeCases = await db('cases')
      .where({ lawyer_id: lawyerId, status: 'active' })
      .count('id as count')
      .first();

    // Total clients count
    const totalClients = await db('cases')
      .where({ lawyer_id: lawyerId })
      .countDistinct('client_id as count')
      .first();

    // Monthly revenue - set to 0 since invoices table deleted
    const monthlyRevenue = { total: 0 };

    // Upcoming hearings
    const upcomingHearings = await db('events')
      .where({ lawyer_id: lawyerId, event_type: 'hearing', status: 'scheduled' })
      .where('start_date_time', '>', new Date())
      .count('id as count')
      .first();

    res.json({
      success: true,
      data: {
        activeCases: activeCases.count || 0,
        totalClients: totalClients.count || 0,
        monthlyRevenue: monthlyRevenue.total || 0,
        upcomingHearings: upcomingHearings.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const recentActivity = await db('events')
      .select('id', 'title', 'event_type', 'start_date_time', 'status')
      .where({ lawyer_id: lawyerId })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({ success: true, data: recentActivity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRevenue = async (req, res) => {
  try {
    // Invoices table deleted - return empty data
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCasesChart = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const casesData = await db('cases')
      .select('status')
      .count('id as count')
      .where({ lawyer_id: lawyerId })
      .groupBy('status');

    res.json({ success: true, data: casesData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getOverview, getRecentActivity, getRevenue, getCasesChart };