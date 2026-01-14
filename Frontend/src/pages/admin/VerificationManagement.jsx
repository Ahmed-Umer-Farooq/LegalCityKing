import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Eye, Lock, Unlock } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

export default function VerificationManagement() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allLawyers, setAllLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [restrictions, setRestrictions] = useState({
    cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
    payment_links: false, quick_actions: false, payment_records: false,
    calendar: false, contacts: false, messages: false
  });

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingVerifications();
    } else {
      fetchAllLawyers();
    }
  }, [activeTab]);

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/verification/pending');
      setPendingVerifications(response.data);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLawyers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/verification/all-lawyers');
      setAllLawyers(response.data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lawyerId) => {
    try {
      await api.post(`/verification/approve/${lawyerId}`, { notes, restrictions });
      showToast.success('Lawyer verification approved!');
      fetchPendingVerifications();
      setSelectedLawyer(null);
      setNotes('');
      setRestrictions({
        cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
        payment_links: false, quick_actions: false, payment_records: false,
        calendar: false, contacts: false, messages: false
      });
    } catch (error) {
      console.error('Error approving verification:', error);
      showToast.error('Failed to approve verification');
    }
  };

  const handleReject = async (lawyerId) => {
    if (!notes.trim()) {
      showToast.error('Please provide rejection reason');
      return;
    }
    try {
      await api.post(`/verification/reject/${lawyerId}`, { notes });
      showToast.success('Lawyer verification rejected');
      fetchPendingVerifications();
      setSelectedLawyer(null);
      setNotes('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      showToast.error('Failed to reject verification');
    }
  };

  const updateRestrictions = async (lawyerId) => {
    try {
      await api.post(`/verification/update-restrictions/${lawyerId}`, { restrictions });
      showToast.success('Restrictions updated successfully');
      if (activeTab === 'pending') {
        fetchPendingVerifications();
      } else {
        fetchAllLawyers();
      }
    } catch (error) {
      showToast.error('Failed to update restrictions');
    }
  };

  const openLawyerModal = (lawyer) => {
    setSelectedLawyer(lawyer);
    setNotes(lawyer.verification_notes || '');
    
    // Load existing restrictions
    if (lawyer.feature_restrictions) {
      try {
        const parsed = typeof lawyer.feature_restrictions === 'string' 
          ? JSON.parse(lawyer.feature_restrictions) 
          : lawyer.feature_restrictions;
        setRestrictions(parsed);
      } catch (e) {
        setRestrictions({
          cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
          payment_links: false, quick_actions: false, payment_records: false,
          calendar: false, contacts: false, messages: false
        });
      }
    } else {
      setRestrictions({
        cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
        payment_links: false, quick_actions: false, payment_records: false,
        calendar: false, contacts: false, messages: false
      });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Lawyer Verification & Restrictions Management</h2>
      
      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending Verifications ({pendingVerifications.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Lawyers - Manage Restrictions
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : activeTab === 'pending' ? (
        pendingVerifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingVerifications.map((lawyer) => (
              <div key={lawyer.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{lawyer.name}</h3>
                      <p className="text-sm text-gray-600">{lawyer.email}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(lawyer.verification_submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openLawyerModal(lawyer)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lawyer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restrictions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allLawyers.map((lawyer) => (
                <tr key={lawyer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{lawyer.name}</div>
                      <div className="text-sm text-gray-500">{lawyer.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lawyer.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                      lawyer.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      lawyer.verification_status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lawyer.verification_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lawyer.is_verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lawyer.feature_restrictions ? (
                      <Lock className="w-5 h-5 text-red-600" />
                    ) : (
                      <Unlock className="w-5 h-5 text-green-600" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openLawyerModal(lawyer)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedLawyer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Lawyer - {selectedLawyer.name}</h3>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p><strong>Email:</strong> {selectedLawyer.email}</p>
              <p><strong>Status:</strong> <span className="capitalize">{selectedLawyer.verification_status || 'pending'}</span></p>
              <p><strong>Verified:</strong> {selectedLawyer.is_verified ? 'Yes' : 'No'}</p>
              {selectedLawyer.verification_submitted_at && (
                <p><strong>Submitted:</strong> {new Date(selectedLawyer.verification_submitted_at).toLocaleString()}</p>
              )}
            </div>

            {selectedLawyer.verification_documents && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const docs = JSON.parse(selectedLawyer.verification_documents);
                      return Array.isArray(docs) ? docs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{doc}</span>
                          </div>
                          <button
                            onClick={() => window.open(`http://localhost:5001/uploads/verification/${doc}`, '_blank')}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Open
                          </button>
                        </div>
                      )) : (
                        <div className="p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                          Invalid document format
                        </div>
                      );
                    } catch (error) {
                      // Handle concatenated filenames
                      const docString = String(selectedLawyer.verification_documents || '');
                      const docs = docString.match(/verification-[^.]+\.(png|jpg|jpeg|pdf|doc|docx)/gi) || [docString];
                      
                      return docs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{doc}</span>
                          </div>
                          <button
                            onClick={() => window.open(`http://localhost:5001/uploads/verification/${doc}`, '_blank')}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Open
                          </button>
                        </div>
                      ));
                    }
                  })()}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Admin Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Add notes for approval/rejection..."
              />
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Feature Restrictions (Lock features until verified)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(restrictions).map(feature => (
                  <label key={feature} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded">
                    <input
                      type="checkbox"
                      checked={restrictions[feature]}
                      onChange={(e) => setRestrictions({...restrictions, [feature]: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Check to LOCK features (lawyer cannot access)</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedLawyer.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Apply Restrictions
              </button>
              <button
                onClick={() => updateRestrictions(selectedLawyer.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Unlock className="w-4 h-4" />
                Update Restrictions Only
              </button>
              <button
                onClick={() => handleReject(selectedLawyer.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}