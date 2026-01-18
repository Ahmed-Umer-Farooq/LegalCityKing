// Centralized restriction checker for lawyer dashboard
export const checkFeatureAccess = (featureName, lawyer) => {
  if (!lawyer) {
    return { allowed: false, reason: 'profile_loading' };
  }

  // Check verification status
  const isVerified = lawyer.verification_status === 'approved' || 
                    lawyer.is_verified === true || 
                    lawyer.verified === true;

  // Normalize feature name to check both formats (dash and underscore)
  const normalizedFeatureName = featureName.replace(/-/g, '_');
  const dashFeatureName = featureName.replace(/_/g, '-');

  // 1. Plan restrictions (PRO badge) - Only restriction system
  const planRestrictions = lawyer.plan_restrictions ? 
    (typeof lawyer.plan_restrictions === 'string' ? 
      JSON.parse(lawyer.plan_restrictions) : 
      lawyer.plan_restrictions) : 
    {};

  // Check if plan restrictions exist for this feature
  const hasPlanRestriction = planRestrictions.hasOwnProperty(featureName) || 
                           planRestrictions.hasOwnProperty(normalizedFeatureName) || 
                           planRestrictions.hasOwnProperty(dashFeatureName);

  // If plan restrictions exist, use them
  if (hasPlanRestriction) {
    const isAllowed = planRestrictions[featureName] === true || 
                     planRestrictions[normalizedFeatureName] === true || 
                     planRestrictions[dashFeatureName] === true;
    
    if (!isAllowed) {
      return { allowed: false, reason: 'subscription_required', requiredTier: 'professional' };
    }
    // If plan allows it, still check verification for certain features
    const verificationRequiredFeatures = [
      'messages', 'contacts', 'calendar', 'payment-records', 'payment_records',
      'tasks', 'documents', 'clients', 'cases', 'qa', 'qa_answers', 'payouts',
      'payment-links', 'payment_links', 'reports', 'quick_actions', 'quick-actions'
    ];
    
    if ((verificationRequiredFeatures.includes(featureName) || 
         verificationRequiredFeatures.includes(normalizedFeatureName) || 
         verificationRequiredFeatures.includes(dashFeatureName)) && !isVerified) {
      return { allowed: false, reason: 'verification_required' };
    }
    
    return { allowed: true };
  }

  // 2. Verification requirements (orange lock) - ALL features require verification
  const verificationRequiredFeatures = [
    'messages', 'contacts', 'calendar', 'payment-records', 'payment_records',
    'tasks', 'documents', 'clients', 'cases', 'qa', 'qa_answers', 'payouts',
    'payment-links', 'payment_links', 'reports', 'quick_actions', 'quick-actions',
    'blogs', 'forms', 'ai_analyzer', 'ai-analyzer'
  ];
  
  if (verificationRequiredFeatures.includes(featureName) || 
      verificationRequiredFeatures.includes(normalizedFeatureName) || 
      verificationRequiredFeatures.includes(dashFeatureName)) {
    if (!isVerified) {
      return { allowed: false, reason: 'verification_required' };
    }
  }

  return { allowed: true };
};

export const getRestrictionMessage = (reason, requiredTier) => {
  switch (reason) {
    case 'profile_loading':
      return 'Loading your profile...';
    case 'verification_required':
      return 'This feature requires account verification. Please verify your account to continue.';
    case 'subscription_required':
      return `This feature requires a ${requiredTier === 'premium' ? 'Premium' : 'Professional'} subscription. Upgrade to unlock.`;
    default:
      return 'Access denied';
  }
};

// Get all available features for plan restrictions
export const getAllFeatures = () => {
  return [
    'home', 'quick_actions', 'messages', 'contacts', 'calendar', 'payment_records',
    'tasks', 'documents', 'reports', 'blogs', 'forms', 'payouts', 'payment_links',
    'cases', 'clients', 'qa_answers', 'ai_analyzer', 'profile', 'subscription'
  ];
};
