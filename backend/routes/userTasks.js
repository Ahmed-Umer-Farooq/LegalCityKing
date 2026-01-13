const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/unified/taskController');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.type !== 'user') {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
});

router.get('/', authorize('read', 'tasks'), getTasks);
router.get('/stats', authorize('read', 'tasks'), getTaskStats);
router.post('/', authorize('write', 'tasks'), createTask);
router.put('/:secure_id', authorize('write', 'tasks'), updateTask);
router.delete('/:secure_id', authorize('write', 'tasks'), deleteTask);

module.exports = router;
