import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Eye, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const API_BASE_URL = 'http://localhost:5001/api';

export default function AdminFormsManagement() {
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({ totalForms: 0, approvedForms: 0, pendingForms: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    fetchForms();
    fetchStats();
  }, [filter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching forms with filter:', filter);
      const response = await api.get('/forms/admin/all', { params: { status: filter !== 'all' ? filter : undefined } });
      console.log('✅ Forms response:', response.data);
      setForms(response.data.forms || []);
    } catch (error) {
      console.error('❌ Error fetching forms:', error.response?.data || error.message);
      toast.error('Failed to load forms: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/forms/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/forms/admin/${id}/approve`);
      toast.success('Form approved successfully!');
      fetchForms();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve form');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/forms/admin/${id}/reject`, { reason });
      toast.success('Form rejected');
      fetchForms();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reject form');
    }
  };

  const handleDelete = async (id) => {
    toast(
      <div className="flex flex-col gap-3">
        <p>Are you sure you want to delete this form?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                await api.delete(`/forms/admin/${id}`);
                toast.success('Form deleted successfully');
                fetchForms();
                fetchStats();
              } catch (error) {
                toast.error('Failed to delete form');
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { duration: Infinity }
    );
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600">Total Forms</div>
          <div className="text-2xl font-bold">{stats.totalForms}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.approvedForms}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingForms}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600">Downloads</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalDownloads}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border flex justify-between items-center">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={fetchForms} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No forms found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {forms.map(form => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{form.title}</div>
                      <div className="text-sm text-gray-500">{form.description?.substring(0, 60)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{form.category_name || form.practice_area}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{form.created_by_type}</td>
                    <td className="px-6 py-4 text-sm font-medium">{form.is_free ? 'Free' : `$${form.price}`}</td>
                    <td className="px-6 py-4">{getStatusBadge(form.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {form.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(form.id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(form.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setSelectedForm(form)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(form.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedForm.title}</h2>
              <button onClick={() => setSelectedForm(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-3">
              <div><strong>Description:</strong> {selectedForm.description}</div>
              <div><strong>Category:</strong> {selectedForm.category_name || selectedForm.practice_area}</div>
              <div><strong>Price:</strong> {selectedForm.is_free ? 'Free' : `$${selectedForm.price}`}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedForm.status)}</div>
              <div><strong>Created By:</strong> {selectedForm.created_by_type}</div>
              {selectedForm.file_url && (
                <div className="mt-4">
                  <button
                    onClick={() => window.open(`${API_BASE_URL}/forms/download/${selectedForm.id}`, '_blank')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View/Download Document
                  </button>
                </div>
              )}
              {selectedForm.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <strong>Rejection Reason:</strong> {selectedForm.rejection_reason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
