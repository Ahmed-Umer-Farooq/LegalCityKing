import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    time: '',
    type: 'consultation',
    lawyer_name: '',
    description: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await api.get('/user/appointments', {
        params: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      });
      
      if (response.data.success) {
        const formattedAppointments = response.data.data.map(apt => ({
          secure_id: apt.secure_id,
          date: apt.appointment_date,
          time: apt.appointment_time,
          title: apt.title,
          type: apt.appointment_type,
          lawyer: apt.lawyer_name || 'TBD',
          description: apt.description
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date, day) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getAppointmentsForDate = (date, day) => {
    const dateStr = formatDate(date, day);
    return appointments.filter(apt => apt.date === dateStr);
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr = formatDate(currentDate, day);
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.title || !newAppointment.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/user/appointments', {
        title: newAppointment.title,
        date: selectedDate,
        time: newAppointment.time,
        type: newAppointment.type,
        lawyer_name: newAppointment.lawyer_name,
        description: newAppointment.description
      });
      
      if (response.data.success) {
        toast.success('Appointment scheduled successfully');
        fetchAppointments();
        setNewAppointment({ title: '', time: '', type: 'consultation', lawyer_name: '', description: '' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentSecureId) => {
    try {
      const response = await api.delete(`/user/appointments/${appointmentSecureId}`);
      if (response.data.success) {
        toast.success('Appointment deleted successfully');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-gray-50/30 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Main Content - Meetings */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
              <p className="text-gray-600">Manage your upcoming meetings and consultations</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments
                  .filter(apt => {
                    const appointmentDate = new Date(apt.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return appointmentDate >= today;
                  })
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(apt => (
                    <div key={apt.secure_id} className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{apt.title}</h3>
                            <span className="px-3 py-1 text-xs bg-blue-100/80 text-blue-800 rounded-full whitespace-nowrap border border-blue-200/50">
                              {apt.type}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{new Date(apt.date).toLocaleDateString()} at {apt.time}</span>
                            </div>
                            {apt.lawyer && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{apt.lawyer}</span>
                              </div>
                            )}
                          </div>
                          {apt.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{apt.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAppointment(apt.secure_id)}
                          className="p-2 text-red-600 hover:bg-red-50/50 rounded-lg transition-all duration-300 border border-red-200/50 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                }
                {appointments.filter(apt => {
                  const appointmentDate = new Date(apt.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return appointmentDate >= today;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                    <p className="text-gray-600">Click on a date in the calendar to schedule a new appointment</p>
                  </div>
                )}
              </div>
            )}
      </div>

          {/* Smart Calendar Card - Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/50 rounded-lg transition-all duration-300">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                </div>
                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/50 rounded-lg transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Mini Calendar */}
              <div className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center py-2">
                      <span className="text-sm font-medium text-gray-500">{day}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((day, index) => {
                    const dayAppointments = day ? getAppointmentsForDate(currentDate, day) : [];
                    const todayCheck = isToday(day);
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(day)}
                        disabled={!day}
                        className={`h-10 w-10 text-sm rounded-xl transition-all duration-300 ${
                          todayCheck
                            ? 'bg-blue-500 text-white shadow-lg !important'
                            : day
                            ? 'hover:bg-white/50 text-gray-700 hover:shadow-md'
                            : 'text-gray-300 cursor-default'
                        } ${dayAppointments.length > 0 && !todayCheck ? 'font-semibold bg-blue-50/50' : ''}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-gray-50/50">
                <div className="text-sm text-gray-600 mb-2">This Month</div>
                <div className="text-lg font-semibold text-gray-900">
                  {appointments.length} meetings
                </div>
              </div>
            </div>
          </div>

          {/* Add Appointment Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Schedule Appointment
                  {selectedDate && (
                    <span className="text-sm font-normal text-gray-500 block">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  )}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                      placeholder="Consultation, Meeting, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lawyer Name
                    </label>
                    <input
                      type="text"
                      value={newAppointment.lawyer_name}
                      onChange={(e) => setNewAppointment({...newAppointment, lawyer_name: e.target.value})}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                      placeholder="Lawyer's name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newAppointment.description}
                      onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none"
                      placeholder="Additional details..."
                      rows="2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="meeting">Meeting</option>
                      <option value="court">Court Hearing</option>
                      <option value="review">Document Review</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300/50 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAppointment}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;