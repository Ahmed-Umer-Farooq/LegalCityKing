const db = require('../db');

// Get all connected accounts
const getConnectedAccounts = async (req, res) => {
  try {
    const lawyers = await db('lawyers')
      .leftJoin('earnings', 'lawyers.id', 'earnings.lawyer_id')
      .select(
        'lawyers.id',
        'lawyers.name',
        'lawyers.email',
        'lawyers.stripe_connect_account_id',
        'lawyers.connect_onboarding_complete',
        'lawyers.payouts_enabled',
        'lawyers.payout_schedule',
        'lawyers.last_payout_date',
        'earnings.available_balance',
        'earnings.pending_balance',
        'earnings.total_earned'
      )
      .orderBy('lawyers.created_at', 'desc');

    // Calculate statistics
    const stats = {
      total: lawyers.length,
      connected: lawyers.filter(l => l.stripe_connect_account_id).length,
      not_connected: lawyers.filter(l => !l.stripe_connect_account_id).length,
      pending_verification: lawyers.filter(l => l.stripe_connect_account_id && !l.connect_onboarding_complete).length
    };

    res.json({ lawyers, stats });
  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pending payout requests
const getPendingPayoutRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = db('payouts')
      .join('lawyers', 'payouts.lawyer_id', 'lawyers.id')
      .select(
        'payouts.*',
        'lawyers.name as lawyer_name',
        'lawyers.email as lawyer_email'
      )
      .orderBy('payouts.requested_at', 'desc');

    if (status) {
      query = query.where('payouts.status', status);
    }

    const payouts = await query;

    // Calculate summary
    const pending = await db('payouts')
      .where('status', 'pending')
      .sum('amount as total')
      .count('id as count')
      .first();

    const approvedToday = await db('payouts')
      .where('status', 'paid')
      .whereRaw('DATE(paid_at) = CURDATE()')
      .sum('amount as total')
      .count('id as count')
      .first();

    const failed = await db('payouts')
      .where('status', 'failed')
      .sum('amount as total')
      .count('id as count')
      .first();

    const summary = {
      pending: {
        count: pending.count || 0,
        amount: parseFloat(pending.total || 0)
      },
      approved_today: {
        count: approvedToday.count || 0,
        amount: parseFloat(approvedToday.total || 0)
      },
      failed: {
        count: failed.count || 0,
        amount: parseFloat(failed.total || 0)
      }
    };

    res.json({ payouts, summary });
  } catch (error) {
    console.error('Get payout requests error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve payout
const approvePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const payout = await db('payouts').where('id', id).first();
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ error: 'Payout is not pending' });
    }

    // Update payout status
    await db('payouts').where('id', id).update({
      status: 'processing',
      approved_at: new Date(),
      approved_by_admin_id: adminId,
      updated_at: new Date()
    });

    // Note: In real Stripe integration, the payout is already created
    // This just marks it as approved in our system

    res.json({ 
      success: true, 
      message: 'Payout approved successfully' 
    });
  } catch (error) {
    console.error('Approve payout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject payout
const rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const payout = await db('payouts').where('id', id).first();
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ error: 'Payout is not pending' });
    }

    // Update payout status
    await db('payouts').where('id', id).update({
      status: 'rejected',
      failed_reason: reason || 'Rejected by admin',
      approved_by_admin_id: adminId,
      updated_at: new Date()
    });

    // Return money to available balance
    await db('earnings').where('lawyer_id', payout.lawyer_id).update({
      available_balance: db.raw('available_balance + ?', [payout.amount]),
      pending_balance: db.raw('pending_balance - ?', [payout.amount]),
      updated_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Payout rejected successfully' 
    });
  } catch (error) {
    console.error('Reject payout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get platform earnings
const getPlatformEarnings = async (req, res) => {
  try {
    // Today's earnings
    const today = await db('transactions')
      .whereRaw('DATE(created_at) = CURDATE()')
      .where('status', 'completed')
      .sum('platform_fee as total')
      .count('id as count')
      .first();

    // This week's earnings
    const thisWeek = await db('transactions')
      .whereRaw('YEARWEEK(created_at) = YEARWEEK(CURDATE())')
      .where('status', 'completed')
      .sum('platform_fee as total')
      .count('id as count')
      .first();

    // This month's earnings
    const thisMonth = await db('transactions')
      .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
      .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
      .where('status', 'completed')
      .sum('platform_fee as total')
      .count('id as count')
      .first();

    // All time earnings
    const allTime = await db('transactions')
      .where('status', 'completed')
      .sum('platform_fee as total')
      .sum('amount as total_amount')
      .sum('lawyer_earnings as lawyer_total')
      .count('id as count')
      .first();

    const earnings = {
      today: parseFloat(today.total || 0),
      today_count: today.count || 0,
      this_week: parseFloat(thisWeek.total || 0),
      this_week_count: thisWeek.count || 0,
      this_month: parseFloat(thisMonth.total || 0),
      this_month_count: thisMonth.count || 0,
      all_time: parseFloat(allTime.total || 0),
      all_time_count: allTime.count || 0,
      total_payments: parseFloat(allTime.total_amount || 0),
      total_lawyer_earnings: parseFloat(allTime.lawyer_total || 0)
    };

    res.json(earnings);
  } catch (error) {
    console.error('Get platform earnings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get lawyer details
const getLawyerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const lawyer = await db('lawyers')
      .leftJoin('earnings', 'lawyers.id', 'earnings.lawyer_id')
      .select(
        'lawyers.id',
        'lawyers.name',
        'lawyers.email',
        'lawyers.stripe_connect_account_id',
        'lawyers.connect_onboarding_complete',
        'lawyers.payouts_enabled',
        'lawyers.payout_schedule',
        'lawyers.minimum_payout_amount',
        'lawyers.last_payout_date',
        'earnings.available_balance',
        'earnings.pending_balance',
        'earnings.total_earned'
      )
      .where('lawyers.id', id)
      .first();

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    // Get total paid out
    const totalPaidOut = await db('payouts')
      .where('lawyer_id', id)
      .where('status', 'paid')
      .sum('amount as total')
      .first();

    // Get platform fees paid by this lawyer
    const platformFees = await db('transactions')
      .where('lawyer_id', id)
      .where('status', 'completed')
      .sum('platform_fee as total')
      .first();

    lawyer.total_paid_out = parseFloat(totalPaidOut.total || 0);
    lawyer.platform_fees_paid = parseFloat(platformFees.total || 0);

    res.json(lawyer);
  } catch (error) {
    console.error('Get lawyer details error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get lawyer payout history
const getLawyerPayoutHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const payouts = await db('payouts')
      .where('lawyer_id', id)
      .orderBy('requested_at', 'desc')
      .limit(50);

    res.json(payouts);
  } catch (error) {
    console.error('Get lawyer payout history error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get lawyer transactions
const getLawyerTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    const transactions = await db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .select(
        'transactions.*',
        'users.name as client_name',
        'users.email as client_email'
      )
      .where('transactions.lawyer_id', id)
      .where('transactions.status', 'completed')
      .orderBy('transactions.created_at', 'desc')
      .limit(50);

    res.json(transactions);
  } catch (error) {
    console.error('Get lawyer transactions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get platform statistics
const getPlatformStatistics = async (req, res) => {
  try {
    // Total lawyers
    const totalLawyers = await db('lawyers').count('id as count').first();

    // Connected lawyers
    const connectedLawyers = await db('lawyers')
      .whereNotNull('stripe_connect_account_id')
      .count('id as count')
      .first();

    // Total transactions
    const totalTransactions = await db('transactions')
      .where('status', 'completed')
      .count('id as count')
      .sum('amount as total')
      .first();

    // Total payouts
    const totalPayouts = await db('payouts')
      .where('status', 'paid')
      .count('id as count')
      .sum('amount as total')
      .first();

    // Pending payouts
    const pendingPayouts = await db('payouts')
      .where('status', 'pending')
      .count('id as count')
      .sum('amount as total')
      .first();

    const stats = {
      total_lawyers: totalLawyers.count || 0,
      connected_lawyers: connectedLawyers.count || 0,
      total_transactions: totalTransactions.count || 0,
      total_transaction_amount: parseFloat(totalTransactions.total || 0),
      total_payouts: totalPayouts.count || 0,
      total_payout_amount: parseFloat(totalPayouts.total || 0),
      pending_payouts: pendingPayouts.count || 0,
      pending_payout_amount: parseFloat(pendingPayouts.total || 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get platform statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getConnectedAccounts,
  getPendingPayoutRequests,
  approvePayout,
  rejectPayout,
  getPlatformEarnings,
  getLawyerDetails,
  getLawyerPayoutHistory,
  getLawyerTransactions,
  getPlatformStatistics
};
