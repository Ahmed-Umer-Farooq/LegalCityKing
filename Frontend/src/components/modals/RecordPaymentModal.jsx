import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const RecordPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'check',
    reference_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/payments', formData);
      showToast.success('Payment recorded successfully!');
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'check',
        reference_number: '',
        notes: ''
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Record Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            step="0.01"
            placeholder="Payment Amount ($) *"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Reference Number"
            value={formData.reference_number}
            onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Payment Notes"
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
              {loading ? 'Recording...' : 'Record Payment'}
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

export default RecordPaymentModal;