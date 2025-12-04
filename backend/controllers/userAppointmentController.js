const db = require('../db');
const crypto = require('crypto');

const generateSecureId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const getUserAppointments = async (req, res) => {
  try {
    const userSecureId = req.user.secure_id;
    const { start, end } = req.query;

    let query = db('user_appointments')
      .select('secure_id', 'title', 'description', 'appointment_type', 'appointment_date', 'appointment_time', 'user_secure_id', 'lawyer_name', 'lawyer_id', 'status', 'created_at', 'updated_at')
      .where('user_secure_id', userSecureId);

    if (start && end) {
      query = query.whereBetween('appointment_date', [start, end]);
    }

    const appointments = await query.orderBy('appointment_date');
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUserAppointment = async (req, res) => {
  try {
    const userSecureId = req.user?.secure_id;
    const { title, date, time, type, lawyer_name, description } = req.body;

    if (!userSecureId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!title || !date || !time || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const appointmentData = {
      secure_id: generateSecureId(),
      title,
      description: description || `${type} appointment`,
      appointment_type: type,
      appointment_date: date,
      appointment_time: time,
      user_secure_id: userSecureId,
      lawyer_name: lawyer_name || 'TBD',
      status: 'scheduled'
    };

    console.log('Inserting appointment data:', appointmentData);

    const [appointmentId] = await db('user_appointments').insert(appointmentData);
    const newAppointment = await db('user_appointments').select('secure_id', 'title', 'description', 'appointment_type', 'appointment_date', 'appointment_time', 'user_secure_id', 'lawyer_name', 'lawyer_id', 'status', 'created_at', 'updated_at').where({ id: appointmentId }).first();
    
    console.log('Created appointment:', newAppointment);
    res.status(201).json({ success: true, data: newAppointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserAppointment = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const { title, date, time, type, lawyer_name, description } = req.body;

    let updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (type) updateData.appointment_type = type;
    if (date) updateData.appointment_date = date;
    if (time) updateData.appointment_time = time;
    if (lawyer_name) updateData.lawyer_name = lawyer_name;

    const updated = await db('user_appointments')
      .where({ secure_id, user_secure_id: req.user.secure_id })
      .update({ ...updateData, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const updatedAppointment = await db('user_appointments').where({ secure_id }).first();
    res.json({ success: true, data: updatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUserAppointment = async (req, res) => {
  try {
    const { secure_id } = req.params;
    const userSecureId = req.user.secure_id;

    const deleted = await db('user_appointments').where({ secure_id, user_secure_id: userSecureId }).del();

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
    const userSecureId = req.user.secure_id;
    const { days = 30 } = req.query;
    
    const today = new Date().toISOString().split('T')[0];
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + parseInt(days));
    const upcomingDateStr = upcomingDate.toISOString().split('T')[0];

    const appointments = await db('user_appointments')
      .select('secure_id', 'title', 'description', 'appointment_type', 'appointment_date', 'appointment_time', 'user_secure_id', 'lawyer_name', 'lawyer_id', 'status', 'created_at', 'updated_at')
      .where('user_secure_id', userSecureId)
      .where('status', 'scheduled')
      .whereBetween('appointment_date', [today, upcomingDateStr])
      .orderBy('appointment_date');

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