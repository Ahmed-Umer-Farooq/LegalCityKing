import React, { useEffect, useState } from 'react';
import { Lock, Shield, Crown } from 'lucide-react';
import { checkFeatureAccess, getRestrictionMessage } from '../utils/restrictionChecker';
import VerificationModal from './modals/VerificationModal';

const RestrictedFeature = ({ featureName, lawyer, children, onRestricted }) => {
  const accessCheck = checkFeatureAccess(featureName, lawyer);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (!accessCheck.allowed && onRestricted) {
      onRestricted(accessCheck);
    }
  }, [accessCheck.allowed]);

  if (!accessCheck.allowed) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {accessCheck.reason === 'admin_locked' ? (
                <Shield className="w-10 h-10 text-red-600" />
              ) : accessCheck.reason === 'subscription_required' ? (
                <Crown className="w-10 h-10 text-orange-600" />
              ) : (
                <Lock className="w-10 h-10 text-orange-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {accessCheck.reason === 'admin_locked' ? 'Feature Restricted' : 'Access Restricted'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {getRestrictionMessage(accessCheck.reason, accessCheck.requiredTier)}
            </p>
            
            {accessCheck.reason === 'verification_required' && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                Verify Account
              </button>
            )}
            
            {accessCheck.reason === 'subscription_required' && (
              <button
                onClick={() => {
                  window.location.href = '/lawyer-dashboard/subscription';
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-md"
              >
                Upgrade to {accessCheck.requiredTier === 'premium' ? 'Premium' : 'Professional'}
              </button>
            )}
            
            {accessCheck.reason === 'admin_locked' && (
              <button
                onClick={() => {
                  window.location.href = '/contact-us';
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md"
              >
                Contact Support
              </button>
            )}
          </div>
        </div>
        
        <VerificationModal 
          isOpen={showVerificationModal} 
          onClose={() => setShowVerificationModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default RestrictedFeature;
