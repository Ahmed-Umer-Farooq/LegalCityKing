import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

export default function CreateCallModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    contact_id: '',
    duration: '',
    call_type: '',
    case_id: '',
    notes: '',
    outcome: '',
    scheduled_at: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contact_id || !formData.duration || !formData.call_type) {
      showToast.error('Contact ID, duration, and call type are required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/calls', formData);
      if (response.data?.success) {
        showToast.success('Call logged successfully!');
        onSuccess();
        onClose();
        setFormData({ contact_id: '', duration: '', call_type: '', case_id: '', notes: '', outcome: '', scheduled_at: '' });
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#181A2A]">Log New Call</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact ID *</label>
              <input
                type="text"
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Type *</label>
              <select
                value={formData.call_type}
                onChange={(e) => setFormData({ ...formData, call_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Type</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="missed">Missed</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case ID</label>
              <input
                type="text"
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Outcome</option>
                <option value="successful">Successful</option>
                <option value="no_answer">No Answer</option>
                <option value="voicemail">Voicemail</option>
                <option value="busy">Busy</option>
                <option value="follow_up_needed">Follow-up Needed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Call summary, key points discussed, action items..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#28B779] text-white px-6 py-2 rounded-lg hover:bg-[#229966] disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Call'}
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