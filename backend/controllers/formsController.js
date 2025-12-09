const db = require('../db');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await db('form_categories')
      .where('is_active', true)
      .orderBy('display_order', 'asc');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get all forms (public + filtered by status)
const getForms = async (req, res) => {
  try {
    const { category, practice_area, is_free, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('legal_forms')
      .leftJoin('form_categories', 'legal_forms.category_id', 'form_categories.id')
      .select('legal_forms.*', 'form_categories.name as category_name')
      .where('legal_forms.status', 'approved');

    if (category) query = query.where('legal_forms.category_id', category);
    if (practice_area) query = query.where('legal_forms.practice_area', practice_area);
    if (is_free !== undefined) query = query.where('legal_forms.is_free', is_free === 'true');
    if (search) {
      query = query.where(function() {
        this.where('legal_forms.title', 'like', `%${search}%`)
            .orWhere('legal_forms.description', 'like', `%${search}%`);
      });
    }

    const total = await query.clone().count('legal_forms.id as count').first();
    const forms = await query.orderBy('legal_forms.created_at', 'desc').limit(limit).offset(offset);

    res.json({
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
};

// Get single form
const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await db('legal_forms')
      .leftJoin('form_categories', 'legal_forms.category_id', 'form_categories.id')
      .select('legal_forms.*', 'form_categories.name as category_name')
      .where('legal_forms.id', id)
      .first();

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
};

// Lawyer: Create form
const createForm = async (req, res) => {
  try {
    const { title, description, category_id, practice_area, price, is_free } = req.body;
    const file_path = req.file ? `/uploads/forms/${req.file.filename}` : null;

    if (!title || !category_id) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [formId] = await db('legal_forms').insert({
      title,
      slug: `${slug}-${Date.now()}`,
      description,
      category: practice_area || 'General',
      category_id,
      practice_area,
      file_url: file_path,
      price: (is_free === 'true' || is_free === true) ? 0 : price,
      is_free: (is_free === 'true' || is_free === true) ? 1 : 0,
      created_by: req.user.id,
      created_by_type: req.user.role === 'lawyer' ? 'lawyer' : 'admin',
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    res.status(201).json({ message: 'Form created successfully', formId });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
};

// Lawyer: Get own forms
const getMyForms = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = db('legal_forms')
      .leftJoin('form_categories', 'legal_forms.category_id', 'form_categories.id')
      .select('legal_forms.*', 'form_categories.name as category_name')
      .where('legal_forms.created_by', req.user.id)
      .where('legal_forms.created_by_type', req.user.role === 'lawyer' ? 'lawyer' : 'admin');

    const total = await query.clone().count('legal_forms.id as count').first();
    const forms = await query.orderBy('legal_forms.created_at', 'desc').limit(limit).offset(offset);

    res.json({
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching my forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
};

// Lawyer: Update form
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, practice_area, price, is_free } = req.body;

    const form = await db('legal_forms').where('id', id).first();
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      title,
      description,
      category_id,
      practice_area,
      price: is_free ? 0 : price,
      is_free,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    };

    if (req.file) {
      updateData.file_url = `/uploads/forms/${req.file.filename}`;
    }

    await db('legal_forms').where('id', id).update(updateData);

    res.json({ message: 'Form updated successfully' });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
};

// Lawyer: Delete form
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await db('legal_forms').where('id', id).first();
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db('legal_forms').where('id', id).del();

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
};

// Admin: Get all forms (including pending)
const getAllForms = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('legal_forms')
      .leftJoin('form_categories', 'legal_forms.category_id', 'form_categories.id')
      .select('legal_forms.*', 'form_categories.name as category_name');

    if (status) query = query.where('legal_forms.status', status);

    const total = await query.clone().count('legal_forms.id as count').first();
    const forms = await query.orderBy('legal_forms.created_at', 'desc').limit(limit).offset(offset);

    res.json({
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
};

// Admin: Approve form
const approveForm = async (req, res) => {
  try {
    const { id } = req.params;

    await db('legal_forms').where('id', id).update({
      status: 'approved',
      approved_by: req.user.id,
      rejection_reason: null
    });

    res.json({ message: 'Form approved successfully' });
  } catch (error) {
    console.error('Error approving form:', error);
    res.status(500).json({ error: 'Failed to approve form' });
  }
};

// Admin: Reject form
const rejectForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db('legal_forms').where('id', id).update({
      status: 'rejected',
      approved_by: req.user.id,
      rejection_reason: reason
    });

    res.json({ message: 'Form rejected successfully' });
  } catch (error) {
    console.error('Error rejecting form:', error);
    res.status(500).json({ error: 'Failed to reject form' });
  }
};

// Admin: Get stats
const getFormStats = async (req, res) => {
  try {
    const totalForms = await db('legal_forms').count('id as count').first();
    const approvedForms = await db('legal_forms').where('status', 'approved').count('id as count').first();
    const pendingForms = await db('legal_forms').where('status', 'pending').count('id as count').first();
    const totalDownloads = await db('user_forms').count('id as count').first();

    res.json({
      totalForms: totalForms.count,
      approvedForms: approvedForms.count,
      pendingForms: pendingForms.count,
      totalDownloads: totalDownloads.count
    });
  } catch (error) {
    console.error('Error fetching form stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = {
  getCategories,
  getForms,
  getForm,
  createForm,
  getMyForms,
  updateForm,
  deleteForm,
  getAllForms,
  approveForm,
  rejectForm,
  getFormStats
};
