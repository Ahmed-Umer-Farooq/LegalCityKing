const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { enforceUserType } = require('../middleware/userTypeEnforcement');
const db = require('../db');

// Get lawyer payment records with filters
router.get('/records', authenticate, enforceUserType('lawyer'), authorize('read', 'payment-records'), async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { page = 1, limit = 20, period = 'all', status = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db('transactions')
      .select(
        'transactions.*',
        'users.name as client_name',
        'users.email as client_email'
      )
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where('transactions.lawyer_id', lawyerId)
      .where('transactions.status', 'completed');
    
    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        query = query.where('transactions.created_at', '>=', startDate);
      }
    }
    
    // Apply status filter
    if (status === 'acknowledged') {
      query = query.where('transactions.acknowledged', true);
    } else if (status === 'unacknowledged') {
      query = query.where('transactions.acknowledged', false);
    }
    
    // Get total count for pagination
    const totalQuery = query.clone();
    const total = await totalQuery.count('transactions.id as count').first();
    
    // Get paginated results
    const payments = await query
      .orderBy('transactions.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Get summary statistics
    const summaryQuery = db('transactions')
      .where('lawyer_id', lawyerId)
      .where('status', 'completed');
    
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        summaryQuery.where('created_at', '>=', startDate);
      }
    }
    
    const summary = await summaryQuery
      .select(
        db.raw('COUNT(*) as total_payments'),
        db.raw('SUM(amount) as total_received'),
        db.raw('SUM(platform_fee) as total_fees'),
        db.raw('SUM(lawyer_earnings) as total_earnings'),
        db.raw('COUNT(CASE WHEN acknowledged = 0 THEN 1 END) as unacknowledged_count')
      )
      .first();
    
    res.json({
      payments,
      summary: {
        totalPayments: parseInt(summary.total_payments) || 0,
        totalReceived: parseFloat(summary.total_received) || 0,
        totalFees: parseFloat(summary.total_fees) || 0,
        totalEarnings: parseFloat(summary.total_earnings) || 0,
        unacknowledgedCount: parseInt(summary.unacknowledged_count) || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        totalPages: Math.ceil(total.count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payment records:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export payment records to CSV
router.get('/export', authenticate, enforceUserType('lawyer'), authorize('read', 'payment-records'), async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { period = 'all' } = req.query;
    
    let query = db('transactions')
      .select(
        'transactions.created_at',
        'transactions.description',
        'transactions.amount',
        'transactions.platform_fee',
        'transactions.lawyer_earnings',
        'transactions.acknowledged',
        'users.name as client_name',
        'users.email as client_email'
      )
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where('transactions.lawyer_id', lawyerId)
      .where('transactions.status', 'completed');
    
    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        query = query.where('transactions.created_at', '>=', startDate);
      }
    }
    
    const payments = await query.orderBy('transactions.created_at', 'desc');
    
    // Convert to CSV format
    const csvHeader = 'Date,Service,Client Name,Client Email,Amount,Platform Fee,Net Earnings,Acknowledged\n';
    const csvRows = payments.map(payment => {
      const date = new Date(payment.created_at).toLocaleDateString();
      const acknowledged = payment.acknowledged ? 'Yes' : 'No';
      return `${date},"${payment.description}","${payment.client_name || 'Unknown'}","${payment.client_email || 'N/A'}",${payment.amount},${payment.platform_fee},${payment.lawyer_earnings},${acknowledged}`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payment-records-${period}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting payment records:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
