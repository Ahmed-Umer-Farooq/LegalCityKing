import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Eye, Lock, Unlock } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

export default function VerificationManagement() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allLawyers, setAllLawyers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [restrictions, setRestrictions] = useState({
    cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
    payment_links: false, quick_actions: false, payment_records: false,
    calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
    reports: false, forms: false, profile: false, subscription: false, home: false,
    ai_analyzer: false
  });
  const [userRestrictions, setUserRestrictions] = useState({
    dashboard: false, calendar: false, cases: false, tasks: false, forms: false,
    messages: false, qa: false, blog: false, directory: false, refer: false,
    accounting: false, social_media: false
  });

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingVerifications();
    } else if (activeTab === 'all') {
      fetchAllLawyers();
    } else if (activeTab === 'users') {
      fetchAllUsers();
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

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/verification/all-users');
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
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
        calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
        reports: false, forms: false, profile: false, subscription: false, home: false,
        ai_analyzer: false
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
      fetchAllLawyers();
    } catch (error) {
      showToast.error('Failed to update restrictions');
    }
  };

  const updateUserRestrictions = async (userId) => {
    try {
      await api.post(`/verification/update-user-restrictions/${userId}`, { restrictions: userRestrictions });
      showToast.success('User restrictions updated successfully');
      fetchAllUsers();
    } catch (error) {
      showToast.error('Failed to update user restrictions');
    }
  };

  const openLawyerModal = (lawyer) => {
    setSelectedLawyer(lawyer);
    setNotes(lawyer.verification_notes || '');
    
    if (lawyer.feature_restrictions) {
      try {
        const parsed = typeof lawyer.feature_restrictions === 'string' 
          ? JSON.parse(lawyer.feature_restrictions) 
          : lawyer.feature_restrictions;
        setRestrictions({
          cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
          payment_links: false, quick_actions: false, payment_records: false,
          calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
          reports: false, forms: false, profile: false, subscription: false, home: false,
          ai_analyzer: false
        });
      } catch (e) {
        setRestrictions({
          cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
          payment_links: false, quick_actions: false, payment_records: false,
          calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
          reports: false, forms: false, profile: false, subscription: false, home: false,
          ai_analyzer: false
        });
      }
    } else {
      setRestrictions({
        cases: false, clients: false, documents: false, blogs: false, qa_answers: false,
        payment_links: false, quick_actions: false, payment_records: false,
        calendar: false, contacts: false, messages: false, payouts: false, tasks: false,
        reports: false, forms: false, profile: false, subscription: false, home: false,
        ai_analyzer: false
      });
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    
    if (user.feature_restrictions) {
      try {
        const parsed = typeof user.feature_restrictions === 'string' 
          ? JSON.parse(user.feature_restrictions) 
          : user.feature_restrictions;
        setUserRestrictions(parsed);
      } catch (e) {
        setUserRestrictions({
          dashboard: false, calendar: false, cases: false, tasks: false, forms: false,
          messages: false, qa: false, blog: false, directory: false, refer: false,
          accounting: false, social_media: false
        });
      }
    } else {
      setUserRestrictions({
        dashboard: false, calendar: false, cases: false, tasks: false, forms: false,
        messages: false, qa: false, blog: false, directory: false, refer: false,
        accounting: false, social_media: false
      });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Verification & Restrictions Management</h2>
      
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({pendingVerifications.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Lawyers
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Users
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
                  <button
                    onClick={() => openLawyerModal(lawyer)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'all' ? (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lawyer</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restrictions</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allLawyers.map((lawyer) => (
                <tr key={lawyer.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3">
                    <div>
                      <div className="font-medium text-sm sm:text-base">{lawyer.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{lawyer.email}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      lawyer.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                      lawyer.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      lawyer.verification_status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lawyer.verification_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    {lawyer.is_verified ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    {(() => {
                      if (!lawyer.feature_restrictions) return <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                      try {
                        const parsed = typeof lawyer.feature_restrictions === 'string' ? JSON.parse(lawyer.feature_restrictions) : lawyer.feature_restrictions;
                        const hasRestrictions = Object.values(parsed).some(val => val === true);
                        return hasRestrictions ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" /> : <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                      } catch {
                        return <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                      }
                    })()}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <button
                      onClick={() => openLawyerModal(lawyer)}
                      className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm hover:bg-blue-200"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restrictions</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-3 sm:px-4 py-8 text-center text-gray-500 text-sm">No users found</td>
                </tr>
              ) : (
                allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="font-medium text-sm sm:text-base">{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {(() => {
                        if (!user.feature_restrictions) return <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                        try {
                          const parsed = typeof user.feature_restrictions === 'string' ? JSON.parse(user.feature_restrictions) : user.feature_restrictions;
                          const hasRestrictions = Object.values(parsed).some(val => val === true);
                          return hasRestrictions ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" /> : <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                        } catch {
                          return <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
                        }
                      })()}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <button
                        onClick={() => openUserModal(user)}
                        className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm hover:bg-blue-200"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedLawyer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Lawyer - {selectedLawyer.name}</h3>
              <button onClick={() => setSelectedLawyer(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p><strong>Email:</strong> {selectedLawyer.email}</p>
              <p><strong>Status:</strong> <span className="capitalize">{selectedLawyer.verification_status || 'pending'}</span></p>
              <p><strong>Verified:</strong> {selectedLawyer.is_verified ? 'Yes' : 'No'}</p>
            </div>

            {selectedLawyer.verification_documents && selectedLawyer.verification_documents.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Submitted Documents
                </h4>
                <div className="space-y-2">
                  {selectedLawyer.verification_documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm text-gray-700 truncate flex-1">{doc}</span>
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`http://localhost:5001/api/verification/document/${doc}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!response.ok) throw new Error('Failed to load document');
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          } catch (error) {
                            console.error('Error viewing document:', error);
                            showToast.error('Failed to load document');
                          }
                        }}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Admin Notes:</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded-lg" rows="3" />
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Feature Restrictions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(restrictions).map(feature => (
                  <label key={feature} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded">
                    <input type="checkbox" checked={restrictions[feature]} onChange={(e) => setRestrictions({...restrictions, [feature]: e.target.checked})} className="w-4 h-4 text-red-600 rounded" />
                    <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Check to LOCK features</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleApprove(selectedLawyer.id)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                <CheckCircle className="w-4 h-4" />Approve
              </button>
              <button onClick={() => updateRestrictions(selectedLawyer.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <Unlock className="w-4 h-4" />Update
              </button>
              <button onClick={() => handleReject(selectedLawyer.id)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                <XCircle className="w-4 h-4" />Reject
              </button>
              <button onClick={() => setSelectedLawyer(null)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage User - {selectedUser.first_name} {selectedUser.last_name}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Name:</strong> {selectedUser.name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'N/A'}</p>
              <p><strong>User ID:</strong> {selectedUser.id}</p>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                User Dashboard Restrictions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(userRestrictions).map(feature => (
                  <label key={feature} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded">
                    <input type="checkbox" checked={userRestrictions[feature]} onChange={(e) => setUserRestrictions({...userRestrictions, [feature]: e.target.checked})} className="w-4 h-4 text-red-600 rounded" />
                    <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Check to LOCK features</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => updateUserRestrictions(selectedUser.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <Unlock className="w-4 h-4" />Update Restrictions
              </button>
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
