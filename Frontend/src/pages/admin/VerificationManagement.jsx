import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Eye } from 'lucide-react';
import api from '../../utils/api';

export default function VerificationManagement() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

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

  const handleApprove = async (lawyerId) => {
    try {
      await api.post(`/verification/approve/${lawyerId}`, { notes });
      alert('Lawyer verification approved!');
      fetchPendingVerifications();
      setSelectedLawyer(null);
      setNotes('');
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification');
    }
  };

  const handleReject = async (lawyerId) => {
    if (!notes.trim()) {
      alert('Please provide rejection reason');
      return;
    }
    try {
      await api.post(`/verification/reject/${lawyerId}`, { notes });
      alert('Lawyer verification rejected');
      fetchPendingVerifications();
      setSelectedLawyer(null);
      setNotes('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Lawyer Verification Management</h2>
      
      {pendingVerifications.length === 0 ? (
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
                    onClick={() => setSelectedLawyer(lawyer)}
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
      )}

      {/* Review Modal */}
      {selectedLawyer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Review Verification - {selectedLawyer.name}</h3>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p><strong>Email:</strong> {selectedLawyer.email}</p>
              <p><strong>Submitted:</strong> {new Date(selectedLawyer.verification_submitted_at).toLocaleString()}</p>
            </div>

            {selectedLawyer.verification_documents && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const docs = JSON.parse(selectedLawyer.verification_documents);
                      return Array.isArray(docs) ? docs.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc}</span>
                        </div>
                      )) : (
                        <div className="p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                          Invalid document format
                        </div>
                      );
                    } catch (error) {
                      // Handle single filename string
                      return (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{selectedLawyer.verification_documents}</span>
                          </div>
                          <button
                            onClick={() => window.open(`http://localhost:5001/uploads/verification/${selectedLawyer.verification_documents}`, '_blank')}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Open
                          </button>
                        </div>
                      );
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

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedLawyer.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
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