import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Listen for storage events to refresh when events are created from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'eventCreated') {
        fetchEvents();
        localStorage.removeItem('eventCreated');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      hearing: 'bg-red-100 text-red-800 border-red-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      consultation: 'bg-green-100 text-green-800 border-green-200',
      court_date: 'bg-purple-100 text-purple-800 border-purple-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.other;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks = [];
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        weekDays.push({
          date: date.getDate(),
          fullDate: new Date(date),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === new Date().toDateString()
        });
      }
      weeks.push(weekDays);
    }

    return (
      <div className="bg-white rounded-lg border">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-4 text-center font-semibold text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((dayObj, dayIndex) => {
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start_date_time);
                return eventDate.toDateString() === dayObj.fullDate.toDateString();
              });
              
              return (
                <div key={dayIndex} className={`min-h-[120px] p-2 border-r last:border-r-0 cursor-pointer hover:bg-blue-50 transition-colors ${
                  !dayObj.isCurrentMonth ? 'bg-gray-50' : ''
                } ${dayObj.isToday ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents(dayEvents);
                    setShowEventDetails(true);
                  } else {
                    setSelectedDate(dayObj.fullDate);
                    setShowEventModal(true);
                  }
                }}>
                  <div className={`text-sm font-medium mb-2 ${
                    dayObj.isToday ? 'text-blue-600' : 
                    !dayObj.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {dayObj.date}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const eventTime = new Date(event.start_date_time);
                      return (
                        <div 
                          key={event.id} 
                          className={`text-xs p-1 rounded border ${getEventTypeColor(event.event_type)} cursor-pointer hover:shadow-sm`}
                          title={`${event.title} - ${eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayEvents([event]);
                            setShowEventDetails(true);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75">
                            {eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Events</h1>
          <p className="text-gray-600">Manage your appointments and deadlines</p>
        </div>
        <button 
          onClick={() => {
            // Trigger event creation modal
            window.dispatchEvent(new CustomEvent('openEventModal'));
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-500">
              Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderCalendarGrid()
        )}
      </div>

      {/* All Events List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">All Events</h3>
        </div>
        
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No events found.</p>
            <p className="text-sm mt-1">Create your first event using the Add Event button!</p>
          </div>
        ) : (
          <div className="divide-y">
            {events.map((event) => {
              const eventDate = new Date(event.start_date_time);
              const endDate = event.end_date_time ? new Date(event.end_date_time) : null;
              
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {eventDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                            {' at '}
                            {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {endDate && (
                              <span> - {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            )}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.case_title && (
                          <div className="text-blue-600">
                            Case: {event.case_title}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <button onClick={() => setShowEventDetails(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-4">
              {selectedDayEvents.map((event) => {
                const eventDate = new Date(event.start_date_time);
                return (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {eventDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}, {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-600 mb-2">📍 {event.location}</p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-700">{event.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const eventData = {
                title: formData.get('title'),
                event_type: formData.get('event_type'),
                start_date_time: selectedDate?.toISOString().slice(0, 16),
                description: formData.get('description'),
                location: formData.get('location')
              };
              
              api.post('/events', eventData).then(() => {
                setShowEventModal(false);
                fetchEvents();
              }).catch(err => console.error(err));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input name="title" type="text" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="event_type" className="w-full px-3 py-2 border rounded-lg">
                    <option value="meeting">Meeting</option>
                    <option value="hearing">Hearing</option>
                    <option value="deadline">Deadline</option>
                    <option value="consultation">Consultation</option>
                    <option value="court_date">Court Date</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input name="location" type="text" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" className="w-full px-3 py-2 border rounded-lg" rows="3"></textarea>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;