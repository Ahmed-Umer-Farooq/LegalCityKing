import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const SendMessageModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    message_type: 'email'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/messages', formData);
      showToast.success('Message sent successfully!');
      setFormData({
        subject: '',
        content: '',
        message_type: 'email'
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Send Message</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Subject *"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            placeholder="Message Content *"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-32 resize-none"
            required
          />
          <select
            value={formData.message_type}
            onChange={(e) => setFormData({...formData, message_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="internal">Internal Message</option>
          </select>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
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

export default SendMessageModal;