const db = require('../db');
const crypto = require('crypto');

const generateSecureId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const getUserTasks = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;
    const { status, priority, search } = req.query;

    let query = db('user_tasks')
      .select(
        'user_tasks.secure_id', 'user_tasks.title', 'user_tasks.description', 
        'user_tasks.status', 'user_tasks.priority', 'user_tasks.due_date', 
        'user_tasks.assigned_lawyer', 'user_tasks.created_at', 'user_tasks.updated_at',
        'user_cases.case_number', 'user_cases.title as case_title'
      )
      .leftJoin('user_cases', 'user_tasks.case_secure_id', 'user_cases.secure_id')
      .where('user_tasks.user_secure_id', userSecureId);

    if (status && status !== 'all') {
      query = query.where('user_tasks.status', status);
    }

    if (priority && priority !== 'all') {
      query = query.where('user_tasks.priority', priority);
    }

    if (search) {
      query = query.where(function() {
        this.where('user_tasks.title', 'like', `%${search}%`)
            .orWhere('user_tasks.description', 'like', `%${search}%`);
      });
    }

    const tasks = await query.orderBy('user_tasks.created_at', 'desc');
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserTask = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;
    const { title, description, case_secure_id, assigned_lawyer, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const taskData = {
      secure_id: generateSecureId(),
      title,
      description: description || '',
      user_secure_id: userSecureId,
      case_secure_id: case_secure_id || null,
      assigned_lawyer: assigned_lawyer || '',
      priority: priority || 'medium',
      due_date: due_date || null,
      status: 'pending'
    };

    const [taskId] = await db('user_tasks').insert(taskData);
    const newTask = await db('user_tasks')
      .select('secure_id', 'title', 'description', 'status', 'priority', 'due_date', 'assigned_lawyer', 'created_at', 'updated_at')
      .where({ id: taskId }).first();

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserTask = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userSecureId = req.user.secure_id;
    const { status, priority, due_date, description } = req.body;

    let updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (due_date) updateData.due_date = due_date;
    if (description) updateData.description = description;

    const updated = await db('user_tasks')
      .where({ secure_id, user_secure_id: userSecureId })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updatedTask = await db('user_tasks')
      .select('secure_id', 'title', 'description', 'status', 'priority', 'due_date', 'assigned_lawyer', 'created_at', 'updated_at')
      .where({ secure_id }).first();

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUserTask = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userSecureId = req.user.secure_id;

    const deleted = await db('user_tasks').where({ secure_id, user_secure_id: userSecureId }).del();

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: { message: 'Task deleted successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;

    const [total, pending, inProgress, completed] = await Promise.all([
      db('user_tasks').where('user_secure_id', userSecureId).count('id as count').first(),
      db('user_tasks').where({ user_secure_id: userSecureId, status: 'pending' }).count('id as count').first(),
      db('user_tasks').where({ user_secure_id: userSecureId, status: 'in-progress' }).count('id as count').first(),
      db('user_tasks').where({ user_secure_id: userSecureId, status: 'completed' }).count('id as count').first()
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUserTasks,
  createUserTask,
  updateUserTask,
  deleteUserTask,
  getTaskStats
};