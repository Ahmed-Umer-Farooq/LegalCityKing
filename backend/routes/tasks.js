const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getTasks, createTask, updateTask, deleteTask, updateTaskStatus, getMyTasks, getTaskStats } = require('../controllers/unified/taskController');

router.use(authenticate);

router.get('/', authorize('read', 'tasks'), getTasks);
router.get('/my-tasks', authorize('read', 'tasks'), getMyTasks);
router.post('/', authorize('write', 'tasks'), createTask);
router.put('/:id', authorize('write', 'tasks'), updateTask);
router.put('/:id/status', authorize('write', 'tasks'), updateTaskStatus);
router.delete('/:id', authorize('write', 'tasks'), deleteTask);

module.exports = router;
