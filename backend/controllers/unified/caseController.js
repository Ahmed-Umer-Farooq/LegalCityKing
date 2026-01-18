const db = require('../../db');

// Unified case controller for both lawyers and users
class CaseController {
  // Get cases based on user role
  async getCases(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      let query, countQuery;

      if (role === 'lawyer') {
        query = db('cases')
          .select('cases.*', 'users.name as client_name', 'users.email as client_email')
          .leftJoin('users', 'cases.client_id', 'users.id')
          .where('cases.lawyer_id', userId);
        
        countQuery = db('cases').where({ lawyer_id: userId });
      } else {
        query = db('user_cases')
          .select('*')
          .where('user_id', userId);
        
        countQuery = db('user_cases').where({ user_id: userId });
      }

      if (status && status !== 'all') {
        query = query.where('status', status);
        countQuery = countQuery.where('status', status);
      }

      if (search) {
        query = query.where(function() {
          this.where('title', 'like', `%${search}%`)
              .orWhere('description', 'like', `%${search}%`);
        });
      }

      const cases = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
      const total = await countQuery.count('id as count').first();

      res.json({
        success: true,
        data: cases,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create case based on user role
  async createCase(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { title, description, lawyer_name, priority } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      let caseData, tableName;

      if (role === 'lawyer') {
        const caseNumber = 'CASE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        caseData = {
          title,
          case_number: caseNumber,
          description,
          lawyer_id: userId,
          status: 'active'
        };
        tableName = 'cases';
      } else {
        const caseNumber = 'UC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        caseData = {
          title,
          description: description || '',
          case_type: lawyer_name || '',
          status: priority || 'pending',
          user_id: userId
        };
        tableName = 'user_cases';
      }

      const [caseId] = await db(tableName).insert(caseData);
      const newCase = await db(tableName).where({ id: caseId }).first();

      res.status(201).json({ success: true, data: newCase });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update case
  async updateCase(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      const updateData = req.body;

      if (role === 'lawyer') {
        const { secure_id } = req.params;
        const whereClause = { secure_id, lawyer_id: userId };
        const updated = await db('cases')
          .where(whereClause)
          .update({ ...updateData, updated_at: new Date() });

        if (!updated) {
          return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const updatedCase = await db('cases').where({ secure_id }).first();
        res.json({ success: true, data: updatedCase });
      } else {
        const whereClause = { id, user_id: userId };
        const updated = await db('user_cases')
          .where(whereClause)
          .update({ ...updateData, updated_at: new Date() });

        if (!updated) {
          return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const updatedCase = await db('user_cases').where({ id }).first();
        res.json({ success: true, data: updatedCase });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete case
  async deleteCase(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;

      if (role === 'lawyer') {
        const { secure_id } = req.params;
        const whereClause = { secure_id, lawyer_id: userId };
        const deleted = await db('cases').where(whereClause).del();

        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Case not found' });
        }
      } else {
        const whereClause = { id, user_id: userId };
        const deleted = await db('user_cases').where(whereClause).del();

        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Case not found' });
        }
      }

      res.json({ success: true, data: { message: 'Case deleted successfully' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get case by ID (from original caseController)
  async getCaseById(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;

      let caseData;
      if (role === 'lawyer') {
        caseData = await db('cases')
          .select('cases.*', 'users.name as client_name', 'users.email as client_email')
          .leftJoin('users', 'cases.client_id', 'users.id')
          .where({ 'cases.id': id, 'cases.lawyer_id': userId })
          .first();
      } else {
        caseData = await db('user_cases')
          .where({ id, user_id: userId })
          .first();
      }

      if (!caseData) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      res.json({ success: true, data: caseData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get case timeline (from original caseController)
  async getCaseTimeline(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;

      // Verify case belongs to user
      let caseExists;
      if (role === 'lawyer') {
        caseExists = await db('cases').where({ id, lawyer_id: userId }).first();
      } else {
        caseExists = await db('user_cases').where({ id, user_id: userId }).first();
      }

      if (!caseExists) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      const timeline = await db('events')
        .select('id', 'title', 'start_time', 'end_time', 'description')
        .where({ case_id: id })
        .orderBy('start_time', 'desc');

      res.json({ success: true, data: timeline });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get case stats
  async getCaseStats(req, res) {
    try {
      const { role, id: userId } = req.user;

      if (role === 'lawyer') {
        const stats = await db('cases')
          .select('type', 'status')
          .count('id as count')
          .where({ lawyer_id: userId })
          .groupBy('type', 'status');

        res.json({ success: true, data: stats });
      } else {
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
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Add case document (from userCaseController)
  async addCaseDocument(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      const { document_name } = req.body;

      if (!document_name) {
        return res.status(400).json({ success: false, error: 'Document name is required' });
      }

      const tableName = role === 'lawyer' ? 'cases' : 'user_cases';
      const whereClause = role === 'lawyer' 
        ? { id, lawyer_id: userId }
        : { id, user_id: userId };

      const caseItem = await db(tableName).where(whereClause).first();

      if (!caseItem) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      const updatedDescription = `${caseItem.description || ''}\n\nDocument added: ${document_name} on ${new Date().toISOString().split('T')[0]}`;
      
      await db(tableName)
        .where(whereClause)
        .update({ 
          description: updatedDescription,
          updated_at: new Date() 
        });

      res.json({ success: true, data: { message: 'Document added successfully' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Add case meeting (from userCaseController)
  async addCaseMeeting(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      const { meeting_title, meeting_date, meeting_time } = req.body;

      if (!meeting_title || !meeting_date || !meeting_time) {
        return res.status(400).json({ success: false, error: 'All meeting fields are required' });
      }

      const tableName = role === 'lawyer' ? 'cases' : 'user_cases';
      const whereClause = role === 'lawyer' 
        ? { id, lawyer_id: userId }
        : { id, user_id: userId };

      const caseItem = await db(tableName).where(whereClause).first();

      if (!caseItem) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }

      const updatedDescription = `${caseItem.description || ''}\n\nMeeting scheduled: ${meeting_title} on ${meeting_date} at ${meeting_time}`;
      
      await db(tableName)
        .where(whereClause)
        .update({ 
          description: updatedDescription,
          updated_at: new Date() 
        });

      res.json({ success: true, data: { message: 'Meeting added to case timeline' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CaseController();