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
  const currentTier = (lawyer.subscription_tier || 'free').toLowerCase();
  const isProfessional = currentTier === 'professional';
  const isPremium = currentTier === 'premium';
  const hasAdvancedFeatures = isProfessional || isPremium;

  // Check admin restrictions - normalize feature names (both dash and underscore)
  const restrictions = lawyer.feature_restrictions ? 
    (typeof lawyer.feature_restrictions === 'string' ? 
      JSON.parse(lawyer.feature_restrictions) : 
      lawyer.feature_restrictions) : 
    {};

  // Normalize feature name to check both formats (dash and underscore)
  const normalizedFeatureName = featureName.replace(/-/g, '_');
  const dashFeatureName = featureName.replace(/_/g, '-');
  
  // 1. Admin restrictions (highest priority - red lock)
  if (restrictions[featureName] === true || 
      restrictions[normalizedFeatureName] === true || 
      restrictions[dashFeatureName] === true) {
    return { allowed: false, reason: 'admin_locked' };
  }

  // 2. Plan restrictions (PRO badge) - Check both plan_restrictions and feature_restrictions
  const planRestrictions = lawyer.plan_restrictions ? 
    (typeof lawyer.plan_restrictions === 'string' ? 
      JSON.parse(lawyer.plan_restrictions) : 
      lawyer.plan_restrictions) : 
    {};

  // Check if plan restrictions exist for this feature
  const hasPlanRestriction = planRestrictions.hasOwnProperty(featureName) || 
                           planRestrictions.hasOwnProperty(normalizedFeatureName) || 
                           planRestrictions.hasOwnProperty(dashFeatureName);

  // If plan restrictions exist, they override everything else (except admin restrictions)
  if (hasPlanRestriction) {
    const isAllowed = planRestrictions[featureName] === true || 
                     planRestrictions[normalizedFeatureName] === true || 
                     planRestrictions[dashFeatureName] === true;
    
    if (!isAllowed) {
      return { allowed: false, reason: 'subscription_required', requiredTier: 'professional' };
    }
    // If plan allows it, skip all other checks and allow access
    return { allowed: true };
  }

  // 3. Verification requirements (orange lock)
  const verificationRequiredFeatures = [
    'messages', 'contacts', 'calendar', 'payment-records', 'payment_records',
    'tasks', 'documents', 'clients', 'cases', 'qa', 'qa_answers', 'payouts',
    'payment-links', 'payment_links', 'reports', 'quick_actions', 'quick-actions'
  ];
  
  if (verificationRequiredFeatures.includes(featureName) || 
      verificationRequiredFeatures.includes(normalizedFeatureName) || 
      verificationRequiredFeatures.includes(dashFeatureName)) {
    if (!isVerified) {
      return { allowed: false, reason: 'verification_required' };
    }
  }

  // 4. Hard-coded subscription requirements (only if no plan restrictions)
  const hardCodedRequirements = {
    'payment-links': 'professional',
    'payment_links': 'professional',
    'reports': 'professional',
    'blogs': 'professional',
    'forms': 'premium',
    'ai_analyzer': 'professional',
    'ai-analyzer': 'professional'
  };

  const requiredTier = hardCodedRequirements[featureName] || hardCodedRequirements[normalizedFeatureName] || hardCodedRequirements[dashFeatureName];
  if (requiredTier === 'professional' && !hasAdvancedFeatures) {
    return { allowed: false, reason: 'subscription_required', requiredTier: 'professional' };
  }
  if (requiredTier === 'premium' && !isPremium) {
    return { allowed: false, reason: 'subscription_required', requiredTier: 'premium' };
  }

  // 5. Default free tier restrictions (only if no plan restrictions)
  const freeTierFeatures = ['home', 'profile', 'subscription', 'quick_actions'];
  if (!freeTierFeatures.includes(featureName) && 
      !freeTierFeatures.includes(normalizedFeatureName) && 
      !freeTierFeatures.includes(dashFeatureName) && 
      currentTier === 'free') {
    return { allowed: false, reason: 'subscription_required', requiredTier: 'professional' };
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

// Get all available features for plan restrictions
export const getAllFeatures = () => {
  return [
    'home', 'quick_actions', 'messages', 'contacts', 'calendar', 'payment_records',
    'tasks', 'documents', 'reports', 'blogs', 'forms', 'payouts', 'payment_links',
    'cases', 'clients', 'qa_answers', 'ai_analyzer', 'profile', 'subscription'
  ];
};
