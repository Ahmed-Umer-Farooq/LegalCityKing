const db = require('../db');
const crypto = require('crypto');

// Create secure payment link with client verification
const createPaymentLink = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { 
      service_name, 
      amount, 
      description, 
      expires_in_hours = 24,
      client_email,
      client_name 
    } = req.body;

    // Validate input
    if (!service_name || !amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Service name and amount (minimum $10) are required' 
      });
    }

    // Require client email for security
    if (!client_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client email is required for secure payment links' 
      });
    }

    // Generate unique secure link ID
    const linkId = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Insert payment link into database
    const [paymentLinkId] = await db('payment_links').insert({
      link_id: linkId,
      lawyer_id: lawyerId,
      service_name,
      amount: parseFloat(amount),
      description: description || `${service_name} - Legal Service`,
      client_email,
      client_name,
      expires_at: expiresAt,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Get the created payment link
    const paymentLink = await db('payment_links').where('id', paymentLinkId).first();

    res.status(201).json({
      success: true,
      data: {
        ...paymentLink,
        secure_url: `/user/payment/${linkId}` // Internal secure URL
      }
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all payment links for a lawyer
const getPaymentLinks = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('payment_links')
      .select('payment_links.*', 'transactions.id as transaction_id', 'transactions.status as payment_status')
      .leftJoin('transactions', 'payment_links.link_id', 'transactions.payment_link_id')
      .where('payment_links.lawyer_id', lawyerId);

    if (status !== 'all') {
      query = query.where('payment_links.status', status);
    }

    const paymentLinks = await query
      .orderBy('payment_links.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Add payment URLs to each link
    const linksWithUrls = paymentLinks.map(link => ({
      ...link,
      payment_url: `${process.env.FRONTEND_URL}/pay/${link.link_id}`,
      is_paid: !!link.transaction_id,
      is_expired: new Date() > new Date(link.expires_at)
    }));

    const total = await db('payment_links').where('lawyer_id', lawyerId).count('id as count').first();

    res.json({
      success: true,
      data: linksWithUrls,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: total.count 
      }
    });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment link by ID (requires authentication)
const getPaymentLinkById = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const paymentLink = await db('payment_links')
      .select('payment_links.*', 'lawyers.name as lawyer_name', 'lawyers.email as lawyer_email')
      .leftJoin('lawyers', 'payment_links.lawyer_id', 'lawyers.id')
      .where('payment_links.link_id', linkId)
      .first();

    if (!paymentLink) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment link not found' 
      });
    }

    // Only allow lawyer who created it or authenticated users to view
    if (userRole === 'lawyer' && paymentLink.lawyer_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    // Check if link is expired
    if (new Date() > new Date(paymentLink.expires_at)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment link has expired' 
      });
    }

    // Check if already paid
    const existingTransaction = await db('transactions')
      .where('payment_link_id', linkId)
      .where('status', 'completed')
      .first();

    if (existingTransaction) {
      return res.status(400).json({ 
        success: false, 
        error: 'This payment link has already been used' 
      });
    }

    res.json({
      success: true,
      data: paymentLink
    });
  } catch (error) {
    console.error('Error fetching payment link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update payment link status
const updatePaymentLink = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be active or disabled' 
      });
    }

    const updated = await db('payment_links')
      .where({ id, lawyer_id: lawyerId })
      .update({ 
        status, 
        updated_at: new Date() 
      });

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment link not found' 
      });
    }

    const updatedLink = await db('payment_links').where('id', id).first();
    res.json({ 
      success: true, 
      data: {
        ...updatedLink,
        payment_url: `${process.env.FRONTEND_URL}/pay/${updatedLink.link_id}`
      }
    });
  } catch (error) {
    console.error('Error updating payment link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete payment link
const deletePaymentLink = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    // Check if payment link has been used
    const paymentLink = await db('payment_links').where({ id, lawyer_id: lawyerId }).first();
    if (!paymentLink) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment link not found' 
      });
    }

    const existingTransaction = await db('transactions')
      .where('payment_link_id', paymentLink.link_id)
      .where('status', 'completed')
      .first();

    if (existingTransaction) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete payment link that has been used' 
      });
    }

    const deleted = await db('payment_links').where({ id, lawyer_id: lawyerId }).del();

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment link not found' 
      });
    }

    res.json({ 
      success: true, 
      data: { message: 'Payment link deleted successfully' } 
    });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPaymentLink,
  getPaymentLinks,
  getPaymentLinkById,
  updatePaymentLink,
  deletePaymentLink
};