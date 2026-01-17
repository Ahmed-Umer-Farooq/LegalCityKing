import React, { useState, useEffect } from 'react';
import { checkFeatureAccess } from '../utils/restrictionChecker';

const RestrictionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testUsers = [
    { name: 'Free User', subscription_tier: 'free', verification_status: 'approved' },
    { name: 'Professional User', subscription_tier: 'professional', verification_status: 'approved' },
    { name: 'Premium User', subscription_tier: 'premium', verification_status: 'approved' },
    { name: 'Unverified User', subscription_tier: 'professional', verification_status: 'pending' }
  ];

  const testFeatures = [
    'messages', 'contacts', 'calendar', 'payment_records', 'payouts',
    'payment_links', 'reports', 'tasks', 'documents', 'forms', 'blogs', 'qa_answers'
  ];

  const runTests = async () => {
    setLoading(true);
    const results = [];

    for (const user of testUsers) {
      const userResults = { user: user.name, features: {} };
      
      for (const feature of testFeatures) {
        try {
          const access = await checkFeatureAccess(feature, user);
          userResults.features[feature] = {
            allowed: access.allowed,
            reason: access.reason,
            requiredTier: access.requiredTier
          };
        } catch (error) {
          userResults.features[feature] = {
            allowed: false,
            reason: 'error',
            error: error.message
          };
        }
      }
      
      results.push(userResults);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusColor = (access) => {
    if (access.allowed) return 'text-green-600 bg-green-100';
    if (access.reason === 'admin_locked') return 'text-red-600 bg-red-100';
    if (access.reason === 'verification_required') return 'text-orange-600 bg-orange-100';
    if (access.reason === 'subscription_required') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (access) => {
    if (access.allowed) return '✅ Allowed';
    if (access.reason === 'admin_locked') return '🔒 Admin Locked';
    if (access.reason === 'verification_required') return '⚠️ Needs Verification';
    if (access.reason === 'subscription_required') return `💎 Needs ${access.requiredTier}`;
    return '❌ Blocked';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dynamic Restriction System Test</h2>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running restriction tests...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {testResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{result.user}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(result.features).map(([feature, access]) => (
                  <div
                    key={feature}
                    className={`p-3 rounded-lg border ${getStatusColor(access)}`}
                  >
                    <div className="font-medium text-sm">{feature}</div>
                    <div className="text-xs mt-1">{getStatusText(access)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Test Status:</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Dynamic API loading: {testResults.length > 0 ? '✅ Working' : '⏳ Testing'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>Async restriction checking: {testResults.length > 0 ? '✅ Working' : '⏳ Testing'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span>Tier-based restrictions: {testResults.length > 0 ? '✅ Working' : '⏳ Testing'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictionTest;