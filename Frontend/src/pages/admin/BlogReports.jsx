import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, Flag } from 'lucide-react';

const BlogReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { value: 'reviewed', label: 'Reviewed', icon: Eye, color: 'text-blue-600 bg-blue-100' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'dismissed', label: 'Dismissed', icon: XCircle, color: 'text-gray-600 bg-gray-100' }
  ];

  const reasonLabels = {
    'vulgar': 'Vulgar/Inappropriate Content',
    'spam': 'Spam or Misleading',
    'copyright': 'Copyright Violation',
    'harassment': 'Harassment or Hate Speech',
    'misinformation': 'False Legal Information',
    'other': 'Other'
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStatus]);

  // Refresh parent dashboard count when reports are viewed
  useEffect(() => {
    if (window.parent && window.parent.refreshReportsCount) {
      window.parent.refreshReportsCount();
    }
  }, [reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blogs/reports?status=${selectedStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = '') => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blogs/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });

      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
        // Trigger parent dashboard to refresh count
        if (window.parent && window.parent.refreshReportsCount) {
          window.parent.refreshReportsCount();
        }
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonColor = (reason) => {
    const colors = {
      'vulgar': 'bg-red-100 text-red-800',
      'spam': 'bg-orange-100 text-orange-800',
      'copyright': 'bg-purple-100 text-purple-800',
      'harassment': 'bg-red-100 text-red-800',
      'misinformation': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Blog Reports</h2>
          <p className="text-gray-600 mt-1">Manage reported blog content</p>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-500" />
          <span className="text-sm text-gray-600">{reports.length} reports</span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatus === option.value
                    ? option.color
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">No {selectedStatus} reports at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {report.blog_title || 'Unknown Blog'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(report.reason)}`}>
                        {reasonLabels[report.reason] || report.reason}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Author:</span> {report.author_name || 'Unknown'}</p>
                      <p><span className="font-medium">Reporter:</span> {report.reporter_name || report.reporter_email || 'Anonymous'}</p>
                      <p><span className="font-medium">Reported:</span> {formatDate(report.created_at)}</p>
                      {report.description && (
                        <p><span className="font-medium">Details:</span> {report.description}</p>
                      )}
                      {report.admin_notes && (
                        <p><span className="font-medium">Admin Notes:</span> {report.admin_notes}</p>
                      )}
                      {report.reviewed_by_name && (
                        <p><span className="font-medium">Reviewed by:</span> {report.reviewed_by_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                    
                    {selectedStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          disabled={actionLoading}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          disabled={actionLoading}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Blog Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Title:</span> {selectedReport.blog_title}</p>
                  <p><span className="font-medium">Author:</span> {selectedReport.author_name}</p>

                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Report Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Reason:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(selectedReport.reason)}`}>
                      {reasonLabels[selectedReport.reason] || selectedReport.reason}
                    </span>
                  </p>
                  <p><span className="font-medium">Reporter:</span> {selectedReport.reporter_name || selectedReport.reporter_email || 'Anonymous'}</p>
                  <p><span className="font-medium">Reported:</span> {formatDate(selectedReport.created_at)}</p>
                  {selectedReport.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-gray-700">{selectedReport.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Mark as Resolved'}
                    </button>
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'dismissed')}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Dismiss Report'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogReports;