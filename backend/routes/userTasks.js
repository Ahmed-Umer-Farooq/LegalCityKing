const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/unified/taskController');

router.get('/', authenticateToken, getTasks);
router.get('/stats', authenticateToken, getTaskStats);
router.post('/', authenticateToken, createTask);
router.put('/:secure_id', authenticateToken, updateTask);
router.delete('/:secure_id', authenticateToken, deleteTask);

module.exports = router;