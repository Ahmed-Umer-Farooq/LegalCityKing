const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { getTasks, createTask, updateTask, deleteTask, updateTaskStatus, getMyTasks, getTaskStats } = require('../controllers/unified/taskController');

router.get('/', authenticateToken, getTasks);
router.get('/my-tasks', authenticateToken, getMyTasks);
router.post('/', authenticateToken, createTask);
router.put('/:id', authenticateToken, updateTask);
router.put('/:id/status', authenticateToken, updateTaskStatus);
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;