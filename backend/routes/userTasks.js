const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const {
  getUserTasks,
  createUserTask,
  updateUserTask,
  deleteUserTask,
  getTaskStats
} = require('../controllers/userTaskController');

router.get('/', authenticateToken, getUserTasks);
router.get('/stats', authenticateToken, getTaskStats);
router.post('/', authenticateToken, createUserTask);
router.put('/:secure_id', authenticateToken, updateUserTask);
router.delete('/:secure_id', authenticateToken, deleteUserTask);

module.exports = router;