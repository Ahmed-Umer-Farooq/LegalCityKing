import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const LogCallModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    call_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    call_type: 'consultation',
    is_billable: true,
    billable_rate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/calls', formData);
      showToast.success('Call logged successfully!');
      setFormData({
        title: '',
        description: '',
        call_date: new Date().toISOString().split('T')[0],
        duration_minutes: '',
        call_type: 'consultation',
        is_billable: true,
        billable_rate: ''
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
            type="text"
            placeholder="Call Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            placeholder="Call Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
          />
          <input
            type="date"
            value={formData.call_date}
            onChange={(e) => setFormData({...formData, call_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select
            value={formData.call_type}
            onChange={(e) => setFormData({...formData, call_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_billable}
              onChange={(e) => setFormData({...formData, is_billable: e.target.checked})}
              className="rounded"
            />
            <span className="text-sm">Billable</span>
          </label>
          {formData.is_billable && (
            <input
              type="number"
              step="0.01"
              placeholder="Billable Rate ($)"
              value={formData.billable_rate}
              onChange={(e) => setFormData({...formData, billable_rate: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          )}
          
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