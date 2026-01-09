import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const CreateInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    amount: '',
    due_date: '',
    status: 'draft',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/invoices', formData);
      showToast.success('Invoice created successfully!');
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        amount: '',
        due_date: '',
        status: 'draft',
        description: ''
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">New Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Invoice Number *"
            value={formData.invoice_number}
            onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
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
            placeholder="Due Date"
            value={formData.due_date}
            onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <textarea
            placeholder="Invoice Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
          />
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
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

export default CreateInvoiceModal;