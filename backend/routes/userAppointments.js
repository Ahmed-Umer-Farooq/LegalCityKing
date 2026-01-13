const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { 
  getUserAppointments, 
  createUserAppointment, 
  updateUserAppointment, 
  deleteUserAppointment, 
  getUpcomingUserAppointments 
} = require('../controllers/userAppointmentController');

router.get('/', authenticate, getUserAppointments);
router.get('/upcoming', authenticate, getUpcomingUserAppointments);
router.post('/', authenticate, createUserAppointment);
router.put('/:secure_id', authenticate, updateUserAppointment);
router.delete('/:secure_id', authenticate, deleteUserAppointment);

module.exports = router;
