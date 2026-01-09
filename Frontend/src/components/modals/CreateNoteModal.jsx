import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const CreateNoteModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_private: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/notes', formData);
      showToast.success('Note created successfully!');
      setFormData({
        title: '',
        content: '',
        is_private: false
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">New Note</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Note Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            placeholder="Note Content *"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-32 resize-none"
            required
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_private}
              onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
              className="rounded"
            />
            <span className="text-sm">Private Note</span>
          </label>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Note'}
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

export default CreateNoteModal;