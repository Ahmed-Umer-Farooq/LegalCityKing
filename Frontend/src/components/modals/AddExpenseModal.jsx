import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const AddExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: 'Travel',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    is_billable: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/expenses', formData);
      showToast.success('Expense added successfully!');
      setFormData({
        category: 'Travel',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        is_billable: true
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="Travel">Travel</option>
            <option value="Office">Office</option>
            <option value="Court">Court</option>
            <option value="Research">Research</option>
            <option value="Communication">Communication</option>
            <option value="Other">Other</option>
          </select>
          <textarea
            placeholder="Expense Description *"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount ($) *"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_billable}
              onChange={(e) => setFormData({...formData, is_billable: e.target.checked})}
              className="rounded"
            />
            <span className="text-sm">Billable to Client</span>
          </label>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
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

export default AddExpenseModal;