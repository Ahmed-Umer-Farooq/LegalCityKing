const db = require('../db');
const crypto = require('crypto');

const generateSecureId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    let query = db('user_appointments')
      .select('*')
      .where('user_id', userId);

    if (start && end) {
      query = query.whereBetween('start_time', [start, end]);
    }

    const appointments = await query.orderBy('start_time');
    
    // Format for frontend
    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      secure_id: apt.id.toString(),
      appointment_date: apt.start_time.split(' ')[0],
      appointment_time: apt.start_time.split(' ')[1].substring(0, 5),
      appointment_type: apt.meeting_type,
      lawyer_name: 'TBD'
    }));
    
    res.json({ success: true, data: formattedAppointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserAppointment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, date, time, type, lawyer_name, description } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!title || !date || !time) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const appointmentData = {
      title,
      description: description || `${type || 'General'} appointment`,
      meeting_type: type || 'consultation',
      start_time: `${date} ${time}:00`,
      end_time: `${date} ${time}:00`,
      user_id: userId,
      status: 'scheduled'
    };

    const [appointmentId] = await db('user_appointments').insert(appointmentData);
    const newAppointment = await db('user_appointments').where({ id: appointmentId }).first();
    
    // Format response for frontend
    const response = {
      ...newAppointment,
      secure_id: newAppointment.id.toString(),
      appointment_date: date,
      appointment_time: time,
      appointment_type: type || 'consultation',
      lawyer_name: lawyer_name || 'TBD'
    };
    
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_time, end_time, meeting_type, description } = req.body;

    let updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (meeting_type) updateData.meeting_type = meeting_type;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;

    const updated = await db('user_appointments')
      .where({ id, user_id: req.user.id })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const updatedAppointment = await db('user_appointments').where({ id }).first();
    res.json({ success: true, data: updatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUserAppointment = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userId = req.user.id;

    const deleted = await db('user_appointments').where({ id: secure_id, user_id: userId }).del();

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, data: { message: 'Appointment deleted successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUpcomingUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + parseInt(days));

    const appointments = await db('user_appointments')
      .select('id', 'title', 'description', 'meeting_type', 'start_time', 'end_time', 'user_id', 'lawyer_id', 'status', 'created_at', 'updated_at')
      .where('user_id', userId)
      .where('status', 'scheduled')
      .where('start_time', '>=', today)
      .where('start_time', '<=', upcomingDate)
      .orderBy('start_time');

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  getUserAppointments, 
  createUserAppointment, 
  updateUserAppointment, 
  deleteUserAppointment, 
  getUpcomingUserAppointments 
};