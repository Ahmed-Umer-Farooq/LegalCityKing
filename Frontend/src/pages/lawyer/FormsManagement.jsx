import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Upload, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

const API_BASE_URL = 'http://localhost:5001/api';

export default function FormsManagement() {
  const [forms, setForms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    practice_area: '',
    price: 0,
    is_free: true,
    file: null
  });

  useEffect(() => {
    fetchForms();
    fetchCategories();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forms/my-forms');
      setForms(response.data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/forms/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('practice_area', formData.practice_area);
      formDataToSend.append('price', formData.is_free ? 0 : formData.price);
      formDataToSend.append('is_free', formData.is_free);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      await api.post('/forms/create', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast.success('Form created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category_id: '',
        practice_area: '',
        price: 0,
        is_free: true,
        file: null
      });
      fetchForms();
    } catch (error) {
      console.error('Error creating form:', error);
      showToast.error('Failed to create form');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/forms/${id}`);
      showToast.success('Form deleted successfully!');
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      showToast.error('Failed to delete form');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'Approved' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your legal forms</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-600 mb-4">Create your first legal form to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <FileText className="w-10 h-10 text-blue-600" />
                {getStatusBadge(form.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{form.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{form.category_name || form.practice_area}</span>
                <span className="font-medium">{form.is_free ? 'Free' : `$${form.price}`}</span>
              </div>
              {form.status === 'rejected' && form.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-xs text-red-800"><strong>Rejection Reason:</strong> {form.rejection_reason}</p>
                </div>
              )}
              <div className="flex gap-2">
                {form.file_url ? (
                  <button 
                    onClick={() => window.open(`${API_BASE_URL}/forms/download/${form.id}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Download
                  </button>
                ) : (
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-3 py-2 rounded cursor-not-allowed text-sm">
                    <Eye className="w-4 h-4" />
                    No File
                  </button>
                )}
                <button
                  onClick={() => handleDelete(form.id)}
                  className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create New Form</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Employment Contract Template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this form is used for..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practice Area</label>
                  <input
                    type="text"
                    value={formData.practice_area}
                    onChange={(e) => setFormData({ ...formData, practice_area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Employment Law"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked, price: e.target.checked ? 0 : formData.price })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Free Form</span>
                </label>
                {!formData.is_free && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Price (USD)"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Form File (PDF/DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.file && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.file.name}</p>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your form will be submitted for admin approval before it becomes publicly available.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
