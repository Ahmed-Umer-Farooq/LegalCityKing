const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getAllEvents, createEvent, updateEvent, deleteEvent, getUpcomingEvents, getCalendarEvents } = require('../controllers/eventController');

router.use(authenticate);

// Routes already protected by authenticate
router.get('/', getAllEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/calendar', getCalendarEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
