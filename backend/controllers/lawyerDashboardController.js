const db = require('../db');

const getDashboardStats = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const [totalCases, activeClients, pendingTasks, revenue] = await Promise.all([
      db('cases').where('lawyer_id', lawyerId).count('id as count').first(),
      db('cases').where('lawyer_id', lawyerId).countDistinct('client_name as count').first(),
      db('cases').where({ lawyer_id: lawyerId, status: 'pending' }).count('id as count').first(),
      db('invoices').where({ lawyer_id: lawyerId, status: 'paid' }).sum('amount as total').first()
    ]);

    res.json({
      totalCases: parseInt(totalCases.count) || 0,
      activeClients: parseInt(activeClients.count) || 0,
      pendingTasks: parseInt(pendingTasks.count) || 0,
      revenue: `$${parseFloat(revenue.total) || 0}`
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
      .select('id', 'title', 'type', 'status', 'created_date as date', 'client_name as client', 'description')
      .where('lawyer_id', lawyerId)
      .orderBy('created_date', 'desc');

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

    if (!title || !client || !type) {
      return res.status(400).json({ message: 'Title, client, and type are required' });
    }

    const [caseId] = await db('cases').insert({
      lawyer_id: lawyerId,
      title,
      client_name: client,
      type,
      description: description || '',
      status: 'active',
      created_date: new Date()
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
    
    let query = db('cases')
      .select('client_name as name')
      .count('id as casesCount')
      .where('lawyer_id', lawyerId)
      .groupBy('client_name');

    if (search) {
      query = query.where('client_name', 'like', `%${search}%`);
    }

    const clients = await query;
    
    const processedClients = clients.map((client, index) => ({
      id: index + 1,
      name: client.name,
      email: `${client.name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      cases: parseInt(client.casesCount)
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
    const lawyerId = req.user.id;
    const invoices = await db('invoices')
      .select('id', 'invoice_number', 'client_name', 'amount', 'status', 'created_date')
      .where('lawyer_id', lawyerId)
      .orderBy('created_date', 'desc');

    const processedInvoices = invoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      amount: inv.amount.toString(),
      status: inv.status,
      due_date: new Date(new Date(inv.created_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: inv.created_date
    }));

    res.json(processedInvoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers')
      .select('id', 'name', 'email', 'registration_id', 'law_firm', 'speciality', 'mobile_number', 'address', 'city', 'state', 'is_verified', 'lawyer_verified', 'subscription_tier', 'subscription_status', 'subscription_created_at', 'stripe_customer_id', 'stripe_subscription_id')
      .where('id', lawyerId)
      .first();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.json({
      id: lawyer.id,
      name: lawyer.name,
      email: lawyer.email,
      registration_id: lawyer.registration_id,
      law_firm: lawyer.law_firm,
      speciality: lawyer.speciality,
      mobile_number: lawyer.mobile_number,
      address: lawyer.address,
      city: lawyer.city,
      state: lawyer.state,
      verified: lawyer.is_verified === 1,
      lawyer_verified: lawyer.lawyer_verified === 1,
      subscription_tier: lawyer.subscription_tier || 'free',
      subscription_status: lawyer.subscription_status || 'inactive',
      subscription_created_at: lawyer.subscription_created_at,
      stripe_customer_id: lawyer.stripe_customer_id,
      stripe_subscription_id: lawyer.stripe_subscription_id
    });
  } catch (error) {
    console.error('Get profile error:', error);
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
  getProfile
};