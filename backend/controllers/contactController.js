const db = require('../db');

const getAllContacts = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    console.log('Current lawyer ID:', lawyerId);
    const { page = 1, limit = 1000, type, case_id } = req.query;
    const offset = (page - 1) * limit;

    let query = db('contacts')
      .select('contacts.*', 'cases.title as case_title')
      .leftJoin('cases', 'contacts.case_id', 'cases.id')
      .where('contacts.created_by', lawyerId);

    if (type) query = query.where('contacts.type', type);
    if (case_id) query = query.where('contacts.case_id', case_id);

    const contacts = await query.orderBy('contacts.created_at', 'desc').limit(limit).offset(offset);
    console.log('Found contacts:', contacts.length);
    const total = await db('contacts').where({ created_by: lawyerId }).count('id as count').first();

    res.json({
      success: true,
      data: contacts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createContact = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { name, email, phone, company, title, address, type, case_id, tags } = req.body;

    // Validate case_id exists if provided
    if (case_id) {
      const caseExists = await db('cases').where({ id: case_id, lawyer_id: lawyerId }).first();
      if (!caseExists) {
        return res.status(400).json({ success: false, error: 'Selected case not found or access denied' });
      }
    }

    // If type is 'client', create in users table as well
    if (type === 'client') {
      const [userId] = await db('users').insert({
        name,
        email,
        phone,
        role: 'client',
        created_by_lawyer: lawyerId,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    const [contactId] = await db('contacts').insert({
      name,
      email,
      phone,
      company,
      title,
      address,
      type,
      case_id,
      created_by: lawyerId,
      tags: tags ? JSON.stringify(tags.split(',')) : null
    });

    const newContact = await db('contacts').where({ id: contactId }).first();
    res.status(201).json({ success: true, data: newContact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;
    const updateData = req.body;

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = JSON.stringify(updateData.tags.split(','));
    }

    const updated = await db('contacts')
      .where({ id, created_by: lawyerId })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const updatedContact = await db('contacts').where({ id }).first();
    res.json({ success: true, data: updatedContact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.id;

    const deleted = await db('contacts').where({ id, created_by: lawyerId }).del();

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, data: { message: 'Contact deleted successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllContacts, createContact, updateContact, deleteContact };