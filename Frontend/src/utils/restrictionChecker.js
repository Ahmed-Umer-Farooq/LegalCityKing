// Centralized restriction checker for lawyer dashboard
export const checkFeatureAccess = (featureName, lawyer) => {
  if (!lawyer) {
    return { allowed: false, reason: 'profile_loading' };
  }

  // Check verification status
  const isVerified = lawyer.verification_status === 'approved' || 
                    lawyer.is_verified === true || 
                    lawyer.verified === true;

  // Check subscription tier
  const isProfessional = lawyer.subscription_tier === 'professional' || 
                        lawyer.subscription_tier === 'Professional';
  const isPremium = lawyer.subscription_tier === 'premium' || 
                   lawyer.subscription_tier === 'Premium';
  const hasAdvancedFeatures = isProfessional || isPremium;

  // Check admin restrictions
  const restrictions = lawyer.feature_restrictions ? 
    (typeof lawyer.feature_restrictions === 'string' ? 
      JSON.parse(lawyer.feature_restrictions) : 
      lawyer.feature_restrictions) : 
    {};

  // If admin locked this feature
  if (restrictions[featureName] === true) {
    return { allowed: false, reason: 'admin_locked' };
  }

  // Feature-specific checks
  const featureRequirements = {
    // Verification required features
    'messages': { verification: true },
    'contacts': { verification: true },
    'calendar': { verification: true },
    'payment-records': { verification: true },
    'tasks': { verification: true },
    'documents': { verification: true },
    'clients': { verification: true },
    'cases': { verification: true },
    'qa': { verification: true },
    
    // Professional/Premium features
    'payment-links': { verification: true, subscription: 'professional' },
    'reports': { verification: true, subscription: 'professional' },
    'blogs': { verification: false, subscription: 'professional' },
    
    // Premium only features
    'forms': { verification: false, subscription: 'premium' }
  };

  const requirements = featureRequirements[featureName];
  
  if (!requirements) {
    return { allowed: true }; // No restrictions for this feature
  }

  // Check verification requirement
  if (requirements.verification && !isVerified) {
    return { allowed: false, reason: 'verification_required' };
  }

  // Check subscription requirement
  if (requirements.subscription === 'professional' && !hasAdvancedFeatures) {
    return { allowed: false, reason: 'subscription_required', requiredTier: 'professional' };
  }

  if (requirements.subscription === 'premium' && !isPremium) {
    return { allowed: false, reason: 'subscription_required', requiredTier: 'premium' };
  }

  return { allowed: true };
};

export const getRestrictionMessage = (reason, requiredTier) => {
  switch (reason) {
    case 'profile_loading':
      return 'Loading your profile...';
    case 'admin_locked':
      return 'This feature has been restricted by the administrator. Please contact support.';
    case 'verification_required':
      return 'This feature requires account verification. Please verify your account to continue.';
    case 'subscription_required':
      return `This feature requires a ${requiredTier === 'premium' ? 'Premium' : 'Professional'} subscription. Upgrade to unlock.`;
    default:
      return 'Access denied';
  }
};
