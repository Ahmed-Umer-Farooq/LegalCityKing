import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../utils/api';
import { 
  Mail, Phone, Calendar, Search, Filter, Eye, Trash2, 
  CheckCircle, Clock, AlertCircle, Archive, RefreshCw, User
} from 'lucide-react';

const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ new: 0, in_progress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [filter, search, pagination.page]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contact-submissions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          status: filter,
          search
        }
      });
      setSubmissions(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/contact-submissions/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/contact-submissions/${id}`, { status });
      fetchSubmissions();
      fetchStats();
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteSubmission = async (id) => {
    toast(
      <div className="flex flex-col gap-3">
        <p>Are you sure you want to delete this submission?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                await api.delete(`/contact-submissions/${id}`);
                toast.success('Submission deleted successfully');
                fetchSubmissions();
                fetchStats();
                setShowModal(false);
              } catch (error) {
                toast.error('Failed to delete submission');
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
    const statusConfig = {
      new: {
        bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
        text: 'text-blue-800',
        icon: <AlertCircle className="w-3 h-3" />
      },
      in_progress: {
        bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
        text: 'text-amber-800',
        icon: <Clock className="w-3 h-3" />
      },
      resolved: {
        bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
        text: 'text-emerald-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      archived: {
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
        text: 'text-gray-800',
        icon: <Archive className="w-3 h-3" />
      }
    };
    
    const config = statusConfig[status] || statusConfig.new;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Contact Submissions</h1>
              <p className="text-gray-600 mt-1">Manage and respond to user inquiries and contact requests</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">New Submissions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-amber-600">{stats.in_progress}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Resolved</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div className="lg:w-48">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => { fetchSubmissions(); fetchStats(); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Submissions Grid */}
        <div className="grid gap-6">
          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No submissions found</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {sub.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                            {getStatusBadge(sub.status)}
                          </div>
                          <p className="text-gray-700 font-medium mb-2">{sub.subject}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{sub.email}</span>
                            </div>
                            {sub.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{sub.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message Preview */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-gray-700 line-clamp-3">{sub.message}</p>
                      </div>
                    </div>
                    
                    {/* Actions and Info */}
                    <div className="lg:w-64 flex flex-col gap-4">
                      {sub.legal_area && (
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-blue-800">Legal Area: {sub.legal_area}</span>
                        </div>
                      )}
                      
                      <div className="flex lg:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedSubmission(sub); setShowModal(true); }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => deleteSubmission(sub.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.page <= 3) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Detail Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Contact Submission Details</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <p className="text-gray-900 font-medium">{selectedSubmission.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <div className="flex justify-start">{getStatusBadge(selectedSubmission.status)}</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-blue-700 mb-2">Email</label>
                    <p className="text-blue-900">{selectedSubmission.email}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-purple-700 mb-2">Phone</label>
                    <p className="text-purple-900">{selectedSubmission.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-emerald-700 mb-2">Legal Area</label>
                    <p className="text-emerald-900">{selectedSubmission.legal_area || 'N/A'}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-amber-700 mb-2">Submitted</label>
                    <p className="text-amber-900">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Subject */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <p className="text-gray-900 font-medium">{selectedSubmission.subject}</p>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedSubmission.message}</p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Update Status</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'new')}
                      className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      New
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'in_progress')}
                      className="px-4 py-3 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      In Progress
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'resolved')}
                      className="px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolved
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'archived')}
                      className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default ContactSubmissions;
