const db = require('../db');
const crypto = require('crypto');

const generateSecureId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const count = await db('user_cases').count('id as count').first();
  const caseNum = String((count.count || 0) + 1).padStart(3, '0');
  return `CS-${year}-${caseNum}`;
};

const getUserCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search } = req.query;

    let query = db('user_cases')
      .select('*')
      .where('user_id', userId);

    if (status && status !== 'all') {
      query = query.where('status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('case_type', 'like', `%${search}%`);
      });
    }

    const cases = await query.orderBy('created_at', 'desc');
    
    // Format for frontend
    const formattedCases = cases.map(caseItem => ({
      ...caseItem,
      secure_id: caseItem.id.toString(),
      case_number: `CS-${new Date().getFullYear()}-${String(caseItem.id).padStart(3, '0')}`,
      lawyer_name: 'TBD',
      priority: 'medium'
    }));
    
    res.json({ success: true, data: formattedCases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserCase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, lawyer_name, priority } = req.body;

    if (!title || !lawyer_name) {
      return res.status(400).json({ success: false, error: 'Title and lawyer name are required' });
    }

    const caseData = {
      title,
      description: description || '',
      case_type: 'general',
      user_id: userId,
      status: 'pending',
      start_date: new Date().toISOString().split('T')[0]
    };

    const [caseId] = await db('user_cases').insert(caseData);
    const newCase = await db('user_cases').where({ id: caseId }).first();
    
    // Format response for frontend
    const response = {
      ...newCase,
      secure_id: newCase.id.toString(),
      case_number: `CS-${new Date().getFullYear()}-${String(newCase.id).padStart(3, '0')}`,
      lawyer_name: lawyer_name,
      priority: priority || 'medium'
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserCase = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;
    const { status, case_type, description } = req.body;

    let updateData = {};
    if (status) updateData.status = status;
    if (case_type) updateData.case_type = case_type;
    if (description) updateData.description = description;

    const updated = await db('user_cases')
      .where({ id: secure_id, user_id: userId })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const updatedCase = await db('user_cases').where({ id: secure_id }).first();
    updatedCase.secure_id = updatedCase.id.toString();
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addCaseDocument = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;
    const { document_name } = req.body;

    if (!document_name) {
      return res.status(400).json({ success: false, error: 'Document name is required' });
    }

    const caseItem = await db('user_cases')
      .where({ id: secure_id, user_id: userId })
      .first();

    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const updatedDescription = `${caseItem.description || ''}\n\nDocument added: ${document_name} on ${new Date().toISOString().split('T')[0]}`;
    
    await db('user_cases')
      .where({ id: secure_id, user_id: userId })
      .update({ 
        description: updatedDescription,
        updated_at: new Date() 
      });

    res.json({ success: true, data: { message: 'Document added successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addCaseMeeting = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;
    const { meeting_title, meeting_date, meeting_time } = req.body;

    if (!meeting_title || !meeting_date || !meeting_time) {
      return res.status(400).json({ success: false, error: 'All meeting fields are required' });
    }

    const caseItem = await db('user_cases')
      .where({ id: secure_id, user_id: userId })
      .first();

    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const updatedDescription = `${caseItem.description || ''}\n\nMeeting scheduled: ${meeting_title} on ${meeting_date} at ${meeting_time}`;
    
    await db('user_cases')
      .where({ id: secure_id, user_id: userId })
      .update({ 
        description: updatedDescription,
        updated_at: new Date() 
      });

    res.json({ success: true, data: { message: 'Meeting added to case timeline' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCaseStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, active, pending, closed] = await Promise.all([
      db('user_cases').where('user_id', userId).count('id as count').first(),
      db('user_cases').where({ user_id: userId, status: 'active' }).count('id as count').first(),
      db('user_cases').where({ user_id: userId, status: 'pending' }).count('id as count').first(),
      db('user_cases').where({ user_id: userId, status: 'closed' }).count('id as count').first()
    ]);

    res.json({
      success: true,
      data: {
        total: total.count || 0,
        active: active.count || 0,
        pending: pending.count || 0,
        closed: closed.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUserCases,
  createUserCase,
  updateUserCase,
  addCaseDocument,
  addCaseMeeting,
  getCaseStats
};