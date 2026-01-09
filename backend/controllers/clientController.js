const db = require('../db');

const getAllClients = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get clients who either have cases with this lawyer OR were created by this lawyer
    const clients = await db('users')
      .select('users.*')
      .leftJoin('cases', 'users.id', 'cases.client_id')
      .where(function() {
        this.where('cases.lawyer_id', lawyerId)
            .orWhere('users.created_by_lawyer', lawyerId);
      })
      .where('users.role', 'client')
      .groupBy('users.id')
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('users')
      .leftJoin('cases', 'users.id', 'cases.client_id')
      .where(function() {
        this.where('cases.lawyer_id', lawyerId)
            .orWhere('users.created_by_lawyer', lawyerId);
      })
      .where('users.role', 'client')
      .countDistinct('users.id as count')
      .first();

    res.json({
      success: true,
      data: clients,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    // Verify client is associated with lawyer
    const clientCase = await db('cases').where({ client_id: id, lawyer_id: lawyerId }).first();
    if (!clientCase) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const client = await db('users').where({ id }).first();
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, username, address, city, state, zip_code, country, mobile_number } = req.body;
    const lawyerId = req.user.id;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const [clientId] = await db('users').insert({
      name,
      email,
      username,
      mobile_number,
      address,
      city,
      state,
      zip_code,
      country,
      role: 'client',
      created_by_lawyer: lawyerId,
      email_verified: 0,
      is_active: 0, // Clients can't login
      created_at: new Date(),
      updated_at: new Date()
    });

    const newClient = await db('users').where({ id: clientId }).first();
    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;
    const updateData = req.body;

    // Verify client is associated with lawyer
    const clientCase = await db('cases').where({ client_id: id, lawyer_id: lawyerId }).first();
    if (!clientCase) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    await db('users').where({ id }).update(updateData);
    const updatedClient = await db('users').where({ id }).first();
    res.json({ success: true, data: updatedClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    // Verify client is associated with lawyer
    const clientCase = await db('cases').where({ client_id: id, lawyer_id: lawyerId }).first();
    if (!clientCase) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    await db('users').where({ id }).del();
    res.json({ success: true, data: { message: 'Client deleted successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getClientCases = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    const cases = await db('cases')
      .where({ client_id: id, lawyer_id: lawyerId })
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getClientInvoices = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    const invoices = await db('invoices')
      .where({ client_id: id, lawyer_id: lawyerId })
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient, getClientCases, getClientInvoices };