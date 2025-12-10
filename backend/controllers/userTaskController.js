const db = require('../db');
const crypto = require('crypto');

const generateSecureId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, search } = req.query;

    let query = db('user_tasks')
      .select('*')
      .where('user_id', userId);

    if (status && status !== 'all') {
      query = query.where('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.where('priority', priority);
    }

    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
      });
    }

    const tasks = await query.orderBy('created_at', 'desc');
    
    // Format for frontend
    const formattedTasks = tasks.map(task => ({
      ...task,
      secure_id: task.id.toString()
    }));
    
    res.json({ success: true, data: formattedTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, priority, due_date, assigned_lawyer } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const taskData = {
      title,
      description: description || '',
      user_id: userId,
      priority: priority || 'medium',
      due_date: due_date || null,
      status: 'pending'
    };

    const [taskId] = await db('user_tasks').insert(taskData);
    const newTask = await db('user_tasks').where({ id: taskId }).first();
    
    // Format response for frontend
    const response = {
      ...newTask,
      secure_id: newTask.id.toString(),
      assigned_lawyer: assigned_lawyer || ''
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserTask = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;
    const { status, priority, due_date, description } = req.body;

    let updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (due_date) updateData.due_date = due_date;
    if (description) updateData.description = description;

    const updated = await db('user_tasks')
      .where({ id: secure_id, user_id: userId })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updatedTask = await db('user_tasks').where({ id: secure_id }).first();
    updatedTask.secure_id = updatedTask.id.toString();
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUserTask = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;

    const deleted = await db('user_tasks').where({ id: secure_id, user_id: userId }).del();

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
    const userId = req.user.id;

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