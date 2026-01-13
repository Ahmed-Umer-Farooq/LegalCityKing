const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry, startTimer, stopTimer } = require('../controllers/timeEntryController');

router.get('/', authenticate, getAllTimeEntries);
router.post('/', authenticate, createTimeEntry);
router.post('/start-timer', authenticate, startTimer);
router.put('/:id', authenticate, updateTimeEntry);
router.put('/:id/stop-timer', authenticate, stopTimer);
router.delete('/:id', authenticate, deleteTimeEntry);

module.exports = router;
