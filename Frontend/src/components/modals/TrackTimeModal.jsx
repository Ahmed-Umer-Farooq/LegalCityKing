import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

export default function TrackTimeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    billable_rate: '',
    activity_type: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hours || !formData.description || !formData.date) {
      alert('Hours, description, and date are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hours: formData.hours,
        description: formData.description,
        date: formData.date,
        billable_rate: formData.billable_rate || 0,
        activity_type: formData.activity_type || 'general'
      };
      const response = await api.post('/time-entries', payload);
      if (response.data?.success) {
        alert('Time entry created successfully!');
        onSuccess();
        onClose();
        setFormData({ hours: '', description: '', date: new Date().toISOString().split('T')[0], billable_rate: '', activity_type: '' });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create time entry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#181A2A]">Track Time</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
              <input
                type="number"
                step="0.25"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0.25"
                placeholder="0.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billable Rate ($/hour)</label>
              <input
                type="number"
                step="0.01"
                value={formData.billable_rate}
                onChange={(e) => setFormData({ ...formData, billable_rate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Activity Type</option>
                <option value="research">Research</option>
                <option value="drafting">Drafting</option>
                <option value="client_meeting">Client Meeting</option>
                <option value="court_appearance">Court Appearance</option>
                <option value="phone_call">Phone Call</option>
                <option value="document_review">Document Review</option>
                <option value="travel">Travel</option>
                <option value="administrative">Administrative</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
                placeholder="Describe the work performed..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#28B779] text-white px-6 py-2 rounded-lg hover:bg-[#229966] disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Time'}
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