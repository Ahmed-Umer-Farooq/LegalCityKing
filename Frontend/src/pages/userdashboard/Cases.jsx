import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Calendar, User, FileText, Clock, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    lawyer_name: '',
    priority: 'medium',
    description: ''
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/cases', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined, search: searchTerm }
      });
      if (response.data.success) {
        setCases(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/cases/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const timeoutId = setTimeout(() => {
      fetchCases();
    }, searchTerm || statusFilter !== 'all' ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100/80 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100/80 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-gray-100/80 text-gray-800 border-gray-200';
      default: return 'bg-gray-100/80 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100/80 text-red-800 border-red-200';
      case 'medium': return 'bg-blue-100/80 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100/80 text-gray-800 border-gray-200';
      default: return 'bg-gray-100/80 text-gray-800 border-gray-200';
    }
  };

  const handleAddCase = async () => {
    if (!newCase.title || !newCase.lawyer_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/user/cases', newCase);
      if (response.data.success) {
        toast.success('Case created successfully');
        fetchCases();
        fetchStats();
        setNewCase({ title: '', lawyer_name: '', priority: 'medium', description: '' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCase = async () => {
    if (!editingCase.title || !editingCase.lawyer_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.put(`/user/cases/${editingCase.id}`, {
        title: editingCase.title,
        case_type: editingCase.lawyer_name,
        status: editingCase.priority,
        description: editingCase.description
      });
      if (response.data.success) {
        toast.success('Case updated successfully');
        fetchCases();
        fetchStats();
        setEditingCase(null);
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId) => {
    toast(
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-900">Delete Case</p>
        <p className="text-sm text-gray-600">Are you sure you want to delete this case? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                setLoading(true);
                const response = await api.delete(`/user/cases/${caseId}`);
                if (response.data.success) {
                  toast.success('Case deleted successfully');
                  fetchCases();
                  fetchStats();
                }
              } catch (error) {
                console.error('Error deleting case:', error);
                toast.error('Failed to delete case');
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>,
      {
        duration: 10000,
        position: 'top-center'
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-gray-50/30 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cases</h1>
            <p className="text-gray-600 mt-1">Manage your legal cases and track progress</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Case
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Cases', value: stats.total, color: 'from-blue-500 to-blue-600', icon: FileText },
            { label: 'Active Cases', value: stats.active, color: 'from-green-500 to-green-600', icon: Clock },
            { label: 'Pending Cases', value: stats.pending, color: 'from-yellow-500 to-yellow-600', icon: Calendar },
            { label: 'Closed Cases', value: stats.closed, color: 'from-gray-500 to-gray-600', icon: FileText }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={`stat-${index}`} className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900">Your Cases ({cases.length})</h2>
          </div>
          <div className="divide-y divide-gray-200/50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-600">Create your first case to get started</p>
              </div>
            ) : (
              cases.map(caseItem => (
                <div key={caseItem.id} className="p-6 hover:bg-white/50 transition-all duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{caseItem.title}</h3>
                          <p className="text-sm text-gray-500">Case #{caseItem.case_number}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                          <span className={`px-3 py-1 text-xs rounded-full border ${getPriorityColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{caseItem.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{caseItem.case_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(caseItem.created_at).toLocaleDateString()}</span>
                        </div>
                        {caseItem.case_number && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Case #{caseItem.case_number}</span>
                          </div>
                        )}
                        {caseItem.next_hearing && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Next Hearing: {new Date(caseItem.next_hearing).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          // Ensure all fields are properly set for editing
                          const caseToEdit = {
                            ...caseItem,
                            lawyer_name: caseItem.case_type || '',
                            priority: caseItem.status || 'pending'
                          };
                          setEditingCase(caseToEdit);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50/50 rounded-lg transition-all duration-300 border border-green-200/50"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50/50 rounded-lg transition-all duration-300 border border-red-200/50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Case Modal */}
        {(showModal || editingCase) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCase ? 'Edit Case' : 'Create New Case'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                  <input
                    type="text"
                    value={editingCase ? editingCase.title : newCase.title}
                    onChange={(e) => editingCase 
                      ? setEditingCase({...editingCase, title: e.target.value})
                      : setNewCase({...newCase, title: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Enter case title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lawyer</label>
                  <input
                    type="text"
                    value={editingCase ? editingCase.lawyer_name : newCase.lawyer_name}
                    onChange={(e) => editingCase 
                      ? setEditingCase({...editingCase, lawyer_name: e.target.value})
                      : setNewCase({...newCase, lawyer_name: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="Lawyer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingCase ? editingCase.priority : newCase.priority}
                    onChange={(e) => editingCase 
                      ? setEditingCase({...editingCase, priority: e.target.value})
                      : setNewCase({...newCase, priority: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingCase ? editingCase.description : newCase.description}
                    onChange={(e) => editingCase 
                      ? setEditingCase({...editingCase, description: e.target.value})
                      : setNewCase({...newCase, description: e.target.value})
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none"
                    placeholder="Brief case description"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCase(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300/50 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCase ? handleEditCase : handleAddCase}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
                >
                  {editingCase ? 'Update Case' : 'Create Case'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;