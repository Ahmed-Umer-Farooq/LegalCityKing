// Cache for dynamic restrictions
let restrictionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch restrictions from API
const fetchRestrictions = async () => {
  try {
    const response = await fetch('/api/admin/subscription-restrictions');
    if (response.ok) {
      const data = await response.json();
      restrictionsCache = data.restrictions || {};
      cacheTimestamp = Date.now();
      return restrictionsCache;
    }
  } catch (error) {
    console.error('Failed to fetch restrictions:', error);
  }
  return {};
};

// Get cached or fresh restrictions
const getRestrictions = async () => {
  if (!restrictionsCache || !cacheTimestamp || (Date.now() - cacheTimestamp > CACHE_DURATION)) {
    return await fetchRestrictions();
  }
  return restrictionsCache;
};

// Get individual lawyer restrictions
const getLawyerRestrictions = async (lawyerId) => {
  try {
    const response = await fetch(`/api/admin/lawyer-restrictions/${lawyerId}`);
    if (response.ok) {
      const data = await response.json();
      return data.restrictions || {};
    }
  } catch (error) {
    console.error('Failed to fetch lawyer restrictions:', error);
  }
  return {};
};

// Centralized restriction checker for lawyer dashboard
export const checkFeatureAccess = async (featureName, lawyer) => {
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

  // Get tier-based restrictions from API
  const tierRestrictions = await getRestrictions();
  const currentTier = lawyer.subscription_tier?.toLowerCase() || 'free';
  const planRestrictions = tierRestrictions[currentTier] || {};
  
  // Get individual lawyer restrictions (overrides plan restrictions)
  const lawyerRestrictions = await getLawyerRestrictions(lawyer.id);
  
  // Merge restrictions (lawyer-specific overrides plan-level)
  const restrictions = { ...planRestrictions, ...lawyerRestrictions };

  // Check admin restrictions
  const normalizedFeatureName = featureName.replace(/-/g, '_');
  const dashFeatureName = featureName.replace(/_/g, '-');
  
  if (restrictions[featureName] === true || 
      restrictions[normalizedFeatureName] === true || 
      restrictions[dashFeatureName] === true) {
    return { allowed: false, reason: 'admin_locked' };
  }

  // Feature-specific checks (support both dash and underscore formats)
  const featureRequirements = {
    'messages': { verification: true },
    'contacts': { verification: true },
    'calendar': { verification: true },
    'payment-records': { verification: true },
    'payment_records': { verification: true },
    'tasks': { verification: true },
    'documents': { verification: true },
    'clients': { verification: true },
    'cases': { verification: true },
    'qa': { verification: true },
    'qa_answers': { verification: true },
    'payouts': { verification: true },
    'payment-links': { verification: true, subscription: 'professional' },
    'payment_links': { verification: true, subscription: 'professional' },
    'reports': { verification: true, subscription: 'professional' },
    'blogs': { verification: false, subscription: 'professional' },
    'forms': { verification: false, subscription: 'premium' },
    'quick_actions': { verification: true },
    'quick-actions': { verification: true }
  };

  const requirements = featureRequirements[featureName];
  
  if (!requirements) {
    return { allowed: true };
  }

  if (requirements.verification && !isVerified) {
    return { allowed: false, reason: 'verification_required' };
  }

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
