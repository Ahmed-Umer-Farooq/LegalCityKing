import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Calendar, User, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [meetingData, setMeetingData] = useState({ date: '', time: '', title: '' });
  const [documentData, setDocumentData] = useState({ name: '', file: null });
  const [newStatus, setNewStatus] = useState('');
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    lawyer_name: '',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, []);

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
    const timeoutId = setTimeout(() => {
      fetchCases();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleUpdateStatus = async (caseSecureId, newStatus) => {
    try {
      const response = await api.put(`/user/cases/${caseSecureId}`, { status: newStatus });
      if (response.data.success) {
        toast.success('Case status updated');
        fetchCases();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update case');
    }
  };

  const handleAddDocument = async (caseSecureId, documentName) => {
    try {
      const response = await api.post(`/user/cases/${caseSecureId}/documents`, {
        document_name: documentName
      });
      if (response.data.success) {
        toast.success('Document added successfully');
        fetchCases();
      }
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: stats.total, color: 'bg-blue-500' },
          { label: 'Active Cases', value: stats.active, color: 'bg-green-500' },
          { label: 'Pending Cases', value: stats.pending, color: 'bg-yellow-500' },
          { label: 'Closed Cases', value: stats.closed, color: 'bg-gray-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Cases ({filteredCases.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
              <p className="text-gray-600">Create your first case to get started</p>
            </div>
          ) : (
            cases.map(caseItem => (
              <div key={caseItem.secure_id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{caseItem.title}</h3>
                      <p className="text-sm text-gray-500">Case #{caseItem.case_number}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority} priority
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{caseItem.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{caseItem.lawyer_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(caseItem.created_at).toLocaleDateString()}</span>
                    </div>
                    {caseItem.next_hearing && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Next: {new Date(caseItem.next_hearing).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedCase(caseItem);
                      setShowDetailModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Case Detail Modal */}
      {showDetailModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedCase.title}</h3>
                <p className="text-sm text-gray-500">Case #{selectedCase.case_number}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Case Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Case Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedCase.status)}`}>
                        {selectedCase.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedCase.priority)}`}>
                        {selectedCase.priority}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedCase.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lawyer:</span>
                      <span className="ml-2 text-gray-900">{selectedCase.lawyer_name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedCase.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedCase.notes}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-3">
                    {selectedCase.timeline?.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          item.type === 'meeting' ? 'bg-green-500' : 
                          item.event.includes('Document') ? 'bg-purple-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.event}</p>
                          <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                          {item.type === 'meeting' && item.meeting_data && (
                            <div className="mt-1 p-2 bg-green-50 rounded text-xs">
                              <p><strong>Meeting:</strong> {item.meeting_data.title}</p>
                              <p><strong>Time:</strong> {item.meeting_data.time}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="space-y-2">
                    {selectedCase.documents?.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="text-sm text-gray-700">{typeof doc === 'string' ? doc : doc.name}</span>
                            {typeof doc === 'object' && doc.added_date && (
                              <p className="text-xs text-gray-500">Added: {new Date(doc.added_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const docName = typeof doc === 'string' ? doc : doc.name;
                            // Create a simple document viewer modal or download
                            alert(`Opening document: ${docName}\n\nNote: This is a demo. In production, this would:\n- Open PDF viewer\n- Download the file\n- Show document preview`);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCase.next_hearing && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Next Hearing</h4>
                    <p className="text-sm text-blue-700">{new Date(selectedCase.next_hearing).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Meeting
                  </button>
                  <button 
                    onClick={() => setShowDocumentModal(true)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Add Document
                  </button>
                  <button 
                    onClick={() => {
                      setNewStatus(selectedCase.status);
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({...meetingData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Case discussion, consultation, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={meetingData.date}
                  onChange={(e) => setMeetingData({...meetingData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={meetingData.time}
                  onChange={(e) => setMeetingData({...meetingData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!meetingData.title || !meetingData.date || !meetingData.time) {
                    toast.error('Please fill in all fields');
                    return;
                  }
                  try {
                    const response = await api.post('/user/appointments', {
                      title: meetingData.title,
                      date: meetingData.date,
                      time: meetingData.time,
                      type: 'meeting',
                      lawyer_name: selectedCase.lawyer_name,
                      description: `Meeting for case: ${selectedCase.title}`
                    });
                    if (response.data.success) {
                      // Also add to case timeline
                      await api.post(`/user/cases/${selectedCase.secure_id}/meetings`, {
                        meeting_title: meetingData.title,
                        meeting_date: meetingData.date,
                        meeting_time: meetingData.time
                      });
                      toast.success('Meeting scheduled successfully');
                      await fetchCases(); // Refresh to show in timeline
                      // Update selected case with fresh data
                      const updatedCases = await api.get('/user/cases');
                      if (updatedCases.data.success) {
                        const refreshedCase = updatedCases.data.data.find(c => c.secure_id === selectedCase.secure_id);
                        if (refreshedCase) setSelectedCase(refreshedCase);
                      }
                      setMeetingData({ date: '', time: '', title: '' });
                      setShowScheduleModal(false);
                    }
                  } catch (error) {
                    console.error('Error scheduling meeting:', error);
                    toast.error('Failed to schedule meeting');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input
                  type="text"
                  value={documentData.name}
                  onChange={(e) => setDocumentData({...documentData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Document title or description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setDocumentData({...documentData, file: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!documentData.name) {
                    toast.error('Please enter document name');
                    return;
                  }
                  try {
                    await handleAddDocument(selectedCase.secure_id, documentData.name);
                    setDocumentData({ name: '', file: null });
                    setShowDocumentModal(false);
                    // Refresh selected case
                    const updatedCase = cases.find(c => c.secure_id === selectedCase.secure_id);
                    if (updatedCase) setSelectedCase(updatedCase);
                  } catch (error) {
                    console.error('Error adding document:', error);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Case Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <p className="text-sm text-gray-600 mb-3">Current: <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedCase?.status)}`}>{selectedCase?.status}</span></p>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await handleUpdateStatus(selectedCase.secure_id, newStatus);
                    setShowStatusModal(false);
                    // Refresh selected case
                    const updatedCase = cases.find(c => c.secure_id === selectedCase.secure_id);
                    if (updatedCase) setSelectedCase(updatedCase);
                  } catch (error) {
                    console.error('Error updating status:', error);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Case</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                <input
                  type="text"
                  value={newCase.title}
                  onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter case title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lawyer</label>
                <input
                  type="text"
                  value={newCase.lawyer_name}
                  onChange={(e) => setNewCase({...newCase, lawyer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Lawyer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newCase.priority}
                  onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief case description"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCase}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;