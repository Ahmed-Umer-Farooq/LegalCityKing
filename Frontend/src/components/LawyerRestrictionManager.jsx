import React, { useState, useEffect } from 'react';
import { User, Lock, Unlock, History, Users } from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toastUtils';

const LawyerRestrictionManager = () => {
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [restrictions, setRestrictions] = useState({});
  const [reason, setReason] = useState('');
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const features = [
    'messages', 'contacts', 'calendar', 'payment_records', 'tasks',
    'documents', 'clients', 'cases', 'qa_answers', 'payouts',
    'payment_links', 'reports', 'blogs', 'forms'
  ];

  useEffect(() => {
    fetchLawyers();
    fetchAuditLog();
  }, []);

  const fetchLawyers = async () => {
    try {
      const response = await api.get('/admin/lawyers');
      setLawyers(response.data.lawyers || []);
    } catch (error) {
      showToast.error('Failed to fetch lawyers');
    }
  };

  const fetchLawyerRestrictions = async (lawyerId) => {
    try {
      const response = await api.get(`/admin/lawyer-restrictions/${lawyerId}`);
      setRestrictions(response.data.restrictions || {});
    } catch (error) {
      setRestrictions({});
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await api.get('/admin/restriction-audit?limit=20');
      setAuditLog(response.data.audit || []);
    } catch (error) {
      console.error('Failed to fetch audit log');
    }
  };

  const handleLawyerSelect = (lawyer) => {
    setSelectedLawyer(lawyer);
    fetchLawyerRestrictions(lawyer.id);
  };

  const handleRestrictionToggle = (feature) => {
    setRestrictions(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const saveRestrictions = async () => {
    if (!selectedLawyer) return;
    
    setLoading(true);
    try {
      await api.post(`/admin/lawyer-restrictions/${selectedLawyer.id}`, {
        restrictions,
        reason
      });
      showToast.success('Restrictions updated successfully');
      setReason('');
      fetchAuditLog();
    } catch (error) {
      showToast.error('Failed to update restrictions');
    } finally {
      setLoading(false);
    }
  };

  const bulkApply = async (planTier) => {
    if (!restrictions || Object.keys(restrictions).length === 0) {
      showToast.error('No restrictions to apply');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/bulk-restrictions', {
        planTier,
        restrictions,
        reason: `Bulk applied from ${selectedLawyer?.name || 'template'}`
      });
      showToast.success(`Restrictions applied to all ${planTier} lawyers`);
      fetchAuditLog();
    } catch (error) {
      showToast.error('Failed to apply bulk restrictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lawyer List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Lawyer
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lawyers.map(lawyer => (
              <button
                key={lawyer.id}
                onClick={() => handleLawyerSelect(lawyer)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedLawyer?.id === lawyer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{lawyer.name}</div>
                <div className="text-sm text-gray-500">{lawyer.subscription_tier}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Restriction Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Individual Restrictions
          </h3>
          
          {selectedLawyer ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedLawyer.name}</div>
                <div className="text-sm text-gray-500">Plan: {selectedLawyer.subscription_tier}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {features.map(feature => (
                  <label key={feature} className="flex items-center gap-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      checked={restrictions[feature] || false}
                      onChange={() => handleRestrictionToggle(feature)}
                      className="rounded"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
              
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for restriction changes..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
              
              <div className="space-y-2">
                <button
                  onClick={saveRestrictions}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Restrictions'}
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => bulkApply('free')}
                    disabled={loading}
                    className="flex-1 bg-gray-600 text-white py-1 text-sm rounded hover:bg-gray-700"
                  >
                    Apply to Free
                  </button>
                  <button
                    onClick={() => bulkApply('professional')}
                    disabled={loading}
                    className="flex-1 bg-orange-600 text-white py-1 text-sm rounded hover:bg-orange-700"
                  >
                    Apply to Pro
                  </button>
                  <button
                    onClick={() => bulkApply('premium')}
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white py-1 text-sm rounded hover:bg-purple-700"
                  >
                    Apply to Premium
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a lawyer to manage restrictions</p>
          )}
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Changes
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLog.map(entry => (
              <div key={entry.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {entry.type === 'plan_restriction' ? 'Plan' : 'Lawyer'} #{entry.target_id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  By: {entry.admin_name}
                </div>
                {entry.reason && (
                  <div className="text-xs text-gray-500 mt-1">{entry.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerRestrictionManager;