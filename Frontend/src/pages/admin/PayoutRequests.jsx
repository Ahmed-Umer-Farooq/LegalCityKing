import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PayoutRequests = () => {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({ pending: {}, approved_today: {}, failed: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${process.env.REACT_APP_API_URL}/api/admin/payouts/payout-requests`
        : `${process.env.REACT_APP_API_URL}/api/admin/payouts/payout-requests?status=${filter}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayouts(res.data.payouts);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/payouts/payout-requests/${payoutId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      console.error('Error approving payout:', err);
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/payouts/payout-requests/${selectedPayout.id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedPayout(null);
      fetchData();
    } catch (err) {
      console.error('Error rejecting payout:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Processing' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payout Requests</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{summary.pending.count || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">${(summary.pending.amount || 0).toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{summary.approved_today.count || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">${(summary.approved_today.amount || 0).toFixed(2)}</p>
            </div>
            <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Failed</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{summary.failed.count || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">${(summary.failed.amount || 0).toFixed(2)}</p>
            </div>
            <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'paid', 'failed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lawyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No payout requests found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.requested_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payout.lawyer_name}</div>
                        <div className="text-sm text-gray-500">{payout.lawyer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payout.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(payout.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reject Payout Request</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Rejecting payout of ${parseFloat(selectedPayout?.amount || 0).toFixed(2)} for {selectedPayout?.lawyer_name}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows="4"
              required
            />
            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                Reject Payout
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedPayout(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutRequests;
