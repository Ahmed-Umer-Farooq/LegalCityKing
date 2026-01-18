const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getAllEvents, createEvent, updateEvent, deleteEvent, getUpcomingEvents, getCalendarEvents } = require('../controllers/eventController');

router.use(authenticate);

router.get('/', authorize('read', 'events'), getAllEvents);
router.get('/upcoming', authorize('read', 'events'), getUpcomingEvents);
router.get('/calendar', authorize('read', 'events'), getCalendarEvents);
router.post('/', authorize('write', 'events'), createEvent);
router.put('/:id', authorize('write', 'events'), updateEvent);
router.delete('/:id', authorize('write', 'events'), deleteEvent);

module.exports = router;
