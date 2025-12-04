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
    const userSecureId = req.user.secure_id;
    const { status, search } = req.query;

    let query = db('user_cases')
      .select('secure_id', 'case_number', 'title', 'description', 'lawyer_name', 'status', 'priority', 'next_hearing', 'notes', 'documents', 'timeline', 'created_at', 'updated_at')
      .where('user_secure_id', userSecureId);

    if (status && status !== 'all') {
      query = query.where('status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('case_number', 'like', `%${search}%`);
      });
    }

    const cases = await query.orderBy('created_at', 'desc');
    
    const formattedCases = cases.map(caseItem => ({
      ...caseItem,
      documents: caseItem.documents ? JSON.parse(caseItem.documents) : [],
      timeline: caseItem.timeline ? JSON.parse(caseItem.timeline) : []
    }));

    res.json({ success: true, data: formattedCases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserCase = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;
    const { title, description, lawyer_name, priority } = req.body;

    if (!title || !lawyer_name) {
      return res.status(400).json({ success: false, error: 'Title and lawyer name are required' });
    }

    const caseNumber = await generateCaseNumber();
    const timeline = [{
      date: new Date().toISOString().split('T')[0],
      event: 'Case opened'
    }];

    const caseData = {
      secure_id: generateSecureId(),
      case_number: caseNumber,
      title,
      description: description || '',
      user_secure_id: userSecureId,
      lawyer_name,
      priority: priority || 'medium',
      status: 'pending',
      timeline: JSON.stringify(timeline),
      documents: JSON.stringify([])
    };

    const [caseId] = await db('user_cases').insert(caseData);
    const newCase = await db('user_cases')
      .select('secure_id', 'case_number', 'title', 'description', 'lawyer_name', 'status', 'priority', 'next_hearing', 'notes', 'documents', 'timeline', 'created_at', 'updated_at')
      .where({ id: caseId }).first();

    res.status(201).json({ 
      success: true, 
      data: {
        ...newCase,
        documents: JSON.parse(newCase.documents || '[]'),
        timeline: JSON.parse(newCase.timeline || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserCase = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userSecureId = req.user.secure_id;
    const { status, priority, next_hearing, notes } = req.body;

    let updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (next_hearing) updateData.next_hearing = next_hearing;
    if (notes) updateData.notes = notes;

    const updated = await db('user_cases')
      .where({ secure_id, user_secure_id: userSecureId })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const updatedCase = await db('user_cases')
      .select('secure_id', 'case_number', 'title', 'description', 'lawyer_name', 'status', 'priority', 'next_hearing', 'notes', 'documents', 'timeline', 'created_at', 'updated_at')
      .where({ secure_id }).first();

    res.json({ 
      success: true, 
      data: {
        ...updatedCase,
        documents: JSON.parse(updatedCase.documents || '[]'),
        timeline: JSON.parse(updatedCase.timeline || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addCaseDocument = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userSecureId = req.user.secure_id;
    const { document_name } = req.body;

    if (!document_name) {
      return res.status(400).json({ success: false, error: 'Document name is required' });
    }

    const caseItem = await db('user_cases')
      .where({ secure_id, user_secure_id: userSecureId })
      .first();

    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const documents = JSON.parse(caseItem.documents || '[]');
    const timeline = JSON.parse(caseItem.timeline || '[]');
    
    documents.push({
      name: document_name,
      added_date: new Date().toISOString().split('T')[0],
      type: 'document'
    });
    
    timeline.push({
      date: new Date().toISOString().split('T')[0],
      event: `Document added: ${document_name}`
    });

    await db('user_cases')
      .where({ secure_id, user_secure_id: userSecureId })
      .update({ 
        documents: JSON.stringify(documents),
        timeline: JSON.stringify(timeline),
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
    const userSecureId = req.user.secure_id;
    const { meeting_title, meeting_date, meeting_time } = req.body;

    if (!meeting_title || !meeting_date || !meeting_time) {
      return res.status(400).json({ success: false, error: 'All meeting fields are required' });
    }

    const caseItem = await db('user_cases')
      .where({ secure_id, user_secure_id: userSecureId })
      .first();

    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const timeline = JSON.parse(caseItem.timeline || '[]');
    
    timeline.push({
      date: meeting_date,
      event: `Meeting scheduled: ${meeting_title} at ${meeting_time}`,
      type: 'meeting',
      meeting_data: { title: meeting_title, date: meeting_date, time: meeting_time }
    });

    await db('user_cases')
      .where({ secure_id, user_secure_id: userSecureId })
      .update({ 
        timeline: JSON.stringify(timeline),
        updated_at: new Date() 
      });

    res.json({ success: true, data: { message: 'Meeting added to case timeline' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCaseStats = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;

    const [total, active, pending, closed] = await Promise.all([
      db('user_cases').where('user_secure_id', userSecureId).count('id as count').first(),
      db('user_cases').where({ user_secure_id: userSecureId, status: 'active' }).count('id as count').first(),
      db('user_cases').where({ user_secure_id: userSecureId, status: 'pending' }).count('id as count').first(),
      db('user_cases').where({ user_secure_id: userSecureId, status: 'closed' }).count('id as count').first()
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