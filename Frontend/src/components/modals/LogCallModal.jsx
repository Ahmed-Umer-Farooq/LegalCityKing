import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const LogCallModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    duration_minutes: '',
    call_type: '',
    outcome: '',
    scheduled_at: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/calls', formData);
      showToast.success('Call logged successfully!');
      setFormData({
        duration_minutes: '',
        call_type: '',
        outcome: '',
        scheduled_at: '',
        notes: ''
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Log Call</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Duration (minutes) *"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={formData.call_type}
            onChange={(e) => setFormData({...formData, call_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select Type</option>
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
          <select
            value={formData.outcome}
            onChange={(e) => setFormData({...formData, outcome: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Outcome</option>
            <option value="successful">Successful</option>
            <option value="follow_up_needed">Follow-up Needed</option>
            <option value="no_answer">No Answer</option>
            <option value="voicemail">Voicemail</option>
            <option value="other">Other</option>
          </select>
          <input
            type="datetime-local"
            placeholder="Scheduled At"
            value={formData.scheduled_at}
            onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
          />
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Call'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogCallModal;