import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

export default function CreateEventModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'meeting',
    start_date_time: '',
    end_date_time: '',
    location: '',
    case_id: '',
    client_id: '',
    description: '',
    attendees: ''
  });
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCasesAndClients();
    }
  }, [isOpen]);

  const fetchCasesAndClients = async () => {
    try {
      const [casesRes, clientsRes] = await Promise.all([
        api.get('/cases?page=1&limit=100'),
        api.get('/clients?page=1&limit=100')
      ]);
      setCases(casesRes.data?.data || []);
      setClients(clientsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date_time) {
      alert('Title and start date/time are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        case_id: formData.case_id || null,
        client_id: formData.client_id || null,
        attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : []
      };
      const response = await api.post('/events', payload);
      if (response.data?.success) {
        alert('Event created successfully!');
        // Signal that an event was created
        localStorage.setItem('eventCreated', Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', { key: 'eventCreated', newValue: Date.now().toString() }));
        onSuccess();
        onClose();
        setFormData({ title: '', event_type: 'meeting', start_date_time: '', end_date_time: '', location: '', case_id: '', client_id: '', description: '', attendees: '' });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#181A2A]">Create New Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hearing">Hearing</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="consultation">Consultation</option>
                <option value="court_date">Court Date</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.start_date_time}
                onChange={(e) => setFormData({ ...formData, start_date_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={formData.end_date_time}
                onChange={(e) => setFormData({ ...formData, end_date_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Case</label>
              <select
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Case (Optional)</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Client</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client (Optional)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendees (comma-separated)</label>
              <input
                type="text"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="e.g., client, opposing_counsel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#28B779] text-white px-6 py-2 rounded-lg hover:bg-[#229966] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
