const db = require('../../db');

// Unified task controller for both lawyers and users
class TaskController {
  // Get tasks based on user role
  async getTasks(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { page = 1, limit = 10, status, priority, search } = req.query;
      const offset = (page - 1) * limit;

      let query, countQuery;

      if (role === 'lawyer') {
        query = db('tasks')
          .select('tasks.*', 'cases.title as case_title', 'assigned.name as assigned_to_name', 'creator.name as created_by_name')
          .leftJoin('cases', 'tasks.case_id', 'cases.id')
          .leftJoin('lawyers as assigned', 'tasks.assigned_to', 'assigned.id')
          .leftJoin('lawyers as creator', 'tasks.created_by', 'creator.id')
          .where(function() {
            this.where('tasks.assigned_to', userId).orWhere('tasks.created_by', userId);
          });
        
        countQuery = db('tasks').where(function() {
          this.where('assigned_to', userId).orWhere('created_by', userId);
        });
      } else {
        query = db('user_tasks')
          .select('*')
          .where('user_id', userId);
        
        countQuery = db('user_tasks').where({ user_id: userId });
      }

      if (status && status !== 'all') {
        query = query.where('status', status);
        countQuery = countQuery.where('status', status);
      }

      if (priority && priority !== 'all') {
        query = query.where('priority', priority);
        countQuery = countQuery.where('priority', priority);
      }

      if (search) {
        query = query.where(function() {
          this.where('title', 'like', `%${search}%`)
              .orWhere('description', 'like', `%${search}%`);
        });
      }

      const tasks = await query.orderBy(role === 'lawyer' ? 'tasks.due_date' : 'created_at', 'desc').limit(limit).offset(offset);
      const total = await countQuery.count('id as count').first();

      res.json({
        success: true,
        data: tasks,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create task based on user role
  async createTask(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { title, description, priority, due_date, case_id, assigned_to } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      let taskData, tableName;

      if (role === 'lawyer') {
        // Validate case_id exists if provided
        if (case_id) {
          const caseExists = await db('cases').where({ id: case_id, lawyer_id: userId }).first();
          if (!caseExists) {
            return res.status(400).json({ success: false, error: 'Selected case not found or access denied' });
          }
        }

        // Validate assigned_to exists if provided
        if (assigned_to && assigned_to !== userId) {
          const assigneeExists = await db('lawyers').where({ id: assigned_to }).first();
          if (!assigneeExists) {
            return res.status(400).json({ success: false, error: 'Assigned lawyer not found' });
          }
        }

        taskData = {
          title,
          description,
          priority: priority || 'medium',
          due_date,
          case_id,
          assigned_to: assigned_to || userId,
          created_by: userId,
          status: 'pending'
        };
        tableName = 'tasks';
      } else {
        taskData = {
          title,
          description: description || '',
          user_id: userId,
          priority: priority || 'medium',
          due_date,
          status: 'pending'
        };
        tableName = 'user_tasks';
      }

      const [taskId] = await db(tableName).insert(taskData);
      const newTask = await db(tableName).where({ id: taskId }).first();

      res.status(201).json({ success: true, data: newTask });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      const updateData = req.body;

      const tableName = role === 'lawyer' ? 'tasks' : 'user_tasks';
      let whereClause;

      if (role === 'lawyer') {
        whereClause = function() {
          this.where('id', id).andWhere(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          });
        };
      } else {
        whereClause = { id, user_id: userId };
      }

      const updated = await db(tableName)
        .where(whereClause)
        .update({ ...updateData, updated_at: new Date() });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const updatedTask = await db(tableName).where({ id }).first();
      res.json({ success: true, data: updatedTask });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;

      const tableName = role === 'lawyer' ? 'tasks' : 'user_tasks';
      let whereClause;

      if (role === 'lawyer') {
        whereClause = function() {
          this.where('id', id).andWhere(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          });
        };
      } else {
        whereClause = { id, user_id: userId };
      }

      const deleted = await db(tableName).where(whereClause).del();

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      res.json({ success: true, data: { message: 'Task deleted successfully' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update task status (from original taskController)
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { role, id: userId } = req.user;

      const tableName = role === 'lawyer' ? 'tasks' : 'user_tasks';
      let whereClause;

      const updateData = { status, updated_at: new Date() };
      if (status === 'completed') {
        updateData.completed_at = new Date();
      }

      if (role === 'lawyer') {
        whereClause = function() {
          this.where('id', id).andWhere(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          });
        };
      } else {
        whereClause = { id, user_id: userId };
      }

      const updated = await db(tableName).where(whereClause).update(updateData);

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const updatedTask = await db(tableName).where({ id }).first();
      res.json({ success: true, data: updatedTask });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my tasks (from original taskController)
  async getMyTasks(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { status = 'pending' } = req.query;

      if (role === 'lawyer') {
        const tasks = await db('tasks')
          .select('tasks.*', 'cases.title as case_title')
          .leftJoin('cases', 'tasks.case_id', 'cases.id')
          .where({ 'tasks.assigned_to': userId, 'tasks.status': status })
          .orderBy('tasks.due_date');

        res.json({ success: true, data: tasks });
      } else {
        const tasks = await db('user_tasks')
          .select('*')
          .where({ user_id: userId, status })
          .orderBy('created_at', 'desc');

        res.json({ success: true, data: tasks });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get task stats (from userTaskController)
  async getTaskStats(req, res) {
    try {
      const { role, id: userId } = req.user;

      if (role === 'lawyer') {
        const [total, pending, inProgress, completed] = await Promise.all([
          db('tasks').where(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          }).count('id as count').first(),
          db('tasks').where(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          }).where('status', 'pending').count('id as count').first(),
          db('tasks').where(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          }).where('status', 'in_progress').count('id as count').first(),
          db('tasks').where(function() {
            this.where('assigned_to', userId).orWhere('created_by', userId);
          }).where('status', 'completed').count('id as count').first()
        ]);

        res.json({
          success: true,
          data: {
            total: total.count || 0,
            pending: pending.count || 0,
            inProgress: inProgress.count || 0,
            completed: completed.count || 0
          }
        });
      } else {
        const [total, pending, inProgress, completed] = await Promise.all([
          db('user_tasks').where('user_id', userId).count('id as count').first(),
          db('user_tasks').where({ user_id: userId, status: 'pending' }).count('id as count').first(),
          db('user_tasks').where({ user_id: userId, status: 'in-progress' }).count('id as count').first(),
          db('user_tasks').where({ user_id: userId, status: 'completed' }).count('id as count').first()
        ]);

        res.json({
          success: true,
          data: {
            total: total.count || 0,
            pending: pending.count || 0,
            inProgress: inProgress.count || 0,
            completed: completed.count || 0
          }
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TaskController();