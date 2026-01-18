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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
      {/* Main Content - Meetings */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-sm lg:text-base text-gray-600">Manage your upcoming meetings and consultations</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {appointments
              .filter(apt => {
                const appointmentDate = new Date(apt.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return appointmentDate >= today;
              })
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(apt => (
                <div key={apt.secure_id} className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 lg:gap-3 mb-2">
                        <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{apt.title}</h3>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                          {apt.type}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs lg:text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                          <span className="truncate">{new Date(apt.date).toLocaleDateString()} at {apt.time}</span>
                        </div>
                        {apt.lawyer && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                            <span className="truncate">{apt.lawyer}</span>
                          </div>
                        )}
                      </div>
                      {apt.description && (
                        <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{apt.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAppointment(apt.secure_id)}
                      className="p-1.5 lg:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
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
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                <p className="text-gray-600">Click on a date in the calendar to schedule a new appointment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Calendar Card - Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>
            <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mini Calendar */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center py-1">
                  <span className="text-xs font-medium text-gray-500">{day}</span>
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
                    className={`h-8 w-8 text-xs rounded-md transition-colors ${
                      todayCheck
                        ? 'bg-blue-500 text-white'
                        : day
                        ? 'hover:bg-gray-100 text-gray-700'
                        : 'text-gray-300 cursor-default'
                    } ${dayAppointments.length > 0 ? 'font-semibold' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">This Month</div>
            <div className="text-sm text-gray-700">
              {appointments.length} meetings
            </div>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAppointment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;