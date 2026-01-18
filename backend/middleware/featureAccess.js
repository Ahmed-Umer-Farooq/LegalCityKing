const db = require('../db');

// Middleware to check if a feature is restricted for the current lawyer
const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'lawyer') {
        return res.status(403).json({ 
          error: 'Access denied. Lawyer account required.',
          code: 'LAWYER_REQUIRED'
        });
      }

      const lawyerId = req.user.id;
      
      // Get fresh lawyer data from database
      const lawyer = await db('lawyers').where({ id: lawyerId }).first();
      
      if (!lawyer) {
        return res.status(404).json({ 
          error: 'Lawyer account not found',
          code: 'LAWYER_NOT_FOUND'
        });
      }

      // Check verification status
      const isVerified = lawyer.verification_status === 'approved' || lawyer.is_verified === true;
      
      // Check subscription tier
      const currentTier = (lawyer.subscription_tier || 'free').toLowerCase();
      const isProfessional = currentTier === 'professional';
      const isPremium = currentTier === 'premium';
      const hasAdvancedFeatures = isProfessional || isPremium;

      // Check admin restrictions (highest priority)
      const restrictions = lawyer.feature_restrictions ? 
        (typeof lawyer.feature_restrictions === 'string' ? 
          JSON.parse(lawyer.feature_restrictions) : 
          lawyer.feature_restrictions) : 
        {};

      // Normalize feature name
      const normalizedFeatureName = featureName.replace(/-/g, '_');
      const dashFeatureName = featureName.replace(/_/g, '-');
      
      // 1. Admin restrictions (red lock)
      if (restrictions[featureName] === true || 
          restrictions[normalizedFeatureName] === true || 
          restrictions[dashFeatureName] === true) {
        return res.status(403).json({ 
          error: 'This feature has been restricted by the administrator. Please contact support.',
          code: 'ADMIN_RESTRICTED'
        });
      }

      // 2. Plan restrictions
      const planRestrictions = lawyer.plan_restrictions ? 
        (typeof lawyer.plan_restrictions === 'string' ? 
          JSON.parse(lawyer.plan_restrictions) : 
          lawyer.plan_restrictions) : 
        {};

      const hasPlanRestriction = planRestrictions.hasOwnProperty(featureName) || 
                               planRestrictions.hasOwnProperty(normalizedFeatureName) || 
                               planRestrictions.hasOwnProperty(dashFeatureName);

      if (hasPlanRestriction) {
        const isAllowed = planRestrictions[featureName] === true || 
                         planRestrictions[normalizedFeatureName] === true || 
                         planRestrictions[dashFeatureName] === true;
        
        if (!isAllowed) {
          return res.status(403).json({ 
            error: 'This feature requires a Professional subscription. Please upgrade your plan.',
            code: 'SUBSCRIPTION_REQUIRED',
            requiredTier: 'professional'
          });
        }
        
        // Still check verification even if plan allows
        if (!isVerified) {
          return res.status(403).json({ 
            error: 'This feature requires account verification. Please verify your account.',
            code: 'VERIFICATION_REQUIRED'
          });
        }
        
        return next();
      }

      // 3. Verification requirements
      const verificationRequiredFeatures = [
        'ai_analyzer', 'ai-analyzer', 'payment_links', 'payment-links', 
        'reports', 'blogs', 'forms'
      ];
      
      if (verificationRequiredFeatures.includes(featureName) || 
          verificationRequiredFeatures.includes(normalizedFeatureName) || 
          verificationRequiredFeatures.includes(dashFeatureName)) {
        if (!isVerified) {
          return res.status(403).json({ 
            error: 'This feature requires account verification. Please verify your account.',
            code: 'VERIFICATION_REQUIRED'
          });
        }
      }

      // 4. Subscription requirements
      const subscriptionRequirements = {
        'ai_analyzer': 'professional',
        'ai-analyzer': 'professional',
        'payment_links': 'professional',
        'payment-links': 'professional',
        'reports': 'professional',
        'blogs': 'professional',
        'forms': 'premium'
      };

      const requiredTier = subscriptionRequirements[featureName] || 
                          subscriptionRequirements[normalizedFeatureName] || 
                          subscriptionRequirements[dashFeatureName];

      if (requiredTier === 'professional' && !hasAdvancedFeatures) {
        return res.status(403).json({ 
          error: 'This feature requires a Professional subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED',
          requiredTier: 'professional'
        });
      }

      if (requiredTier === 'premium' && !isPremium) {
        return res.status(403).json({ 
          error: 'This feature requires a Premium subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED',
          requiredTier: 'premium'
        });
      }

      // All checks passed
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ 
        error: 'Feature access verification failed',
        code: 'ACCESS_CHECK_ERROR'
      });
    }
  };
};

module.exports = { checkFeatureAccess };