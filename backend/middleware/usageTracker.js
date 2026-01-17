const db = require('../db');

// Get lawyer's current usage and limits
const getLawyerUsage = async (lawyerId) => {
  try {
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) throw new Error('Lawyer not found');

    // Get usage counts
    let usage = await db('lawyer_usage').where('lawyer_id', lawyerId).first();
    if (!usage) {
      // Create usage record if doesn't exist
      await db('lawyer_usage').insert({
        lawyer_id: lawyerId,
        cases_count: 0,
        clients_count: 0,
        documents_count: 0,
        blogs_count: 0,
        qa_answers_count: 0,
        payment_links_count: 0
      });
      usage = await db('lawyer_usage').where('lawyer_id', lawyerId).first();
    }

    // Get restrictions (plan + individual overrides)
    const planRestrictions = await db('feature_restrictions')
      .where('plan_tier', lawyer.subscription_tier?.toLowerCase() || 'free')
      .first();
    
    const individualRestrictions = await db('lawyer_restrictions')
      .where('lawyer_id', lawyerId)
      .first();

    const planLimits = planRestrictions ? JSON.parse(planRestrictions.restrictions) : {};
    const individualLimits = individualRestrictions ? JSON.parse(individualRestrictions.restrictions) : {};
    
    // Merge limits (individual overrides plan)
    const limits = { ...planLimits, ...individualLimits };

    return {
      usage: {
        cases: usage.cases_count || 0,
        clients: usage.clients_count || 0,
        documents: usage.documents_count || 0,
        blogs: usage.blogs_count || 0,
        qa_answers: usage.qa_answers_count || 0,
        payment_links: usage.payment_links_count || 0
      },
      limits: {
        cases: limits.cases || -1,
        clients: limits.clients || -1,
        documents: limits.documents || -1,
        blogs: limits.blogs || -1,
        qa_answers: limits.qa_answers || -1,
        payment_links: limits.payment_links || -1
      }
    };
  } catch (error) {
    console.error('Error getting lawyer usage:', error);
    throw error;
  }
};

// Check if action is allowed
const checkUsageLimit = async (lawyerId, resource) => {
  const { usage, limits } = await getLawyerUsage(lawyerId);
  
  const currentUsage = usage[resource] || 0;
  const limit = limits[resource] || -1;
  
  // -1 means unlimited
  if (limit === -1) return { allowed: true, usage: currentUsage, limit };
  
  return {
    allowed: currentUsage < limit,
    usage: currentUsage,
    limit,
    remaining: Math.max(0, limit - currentUsage)
  };
};

// Increment usage counter
const incrementUsage = async (lawyerId, resource) => {
  const field = `${resource}_count`;
  await db('lawyer_usage')
    .where('lawyer_id', lawyerId)
    .increment(field, 1);
};

// Decrement usage counter
const decrementUsage = async (lawyerId, resource) => {
  const field = `${resource}_count`;
  await db('lawyer_usage')
    .where('lawyer_id', lawyerId)
    .decrement(field, 1);
};

// Middleware to check limits before actions
const enforceUsageLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const lawyerId = req.user.id;
      const check = await checkUsageLimit(lawyerId, resource);
      
      if (!check.allowed) {
        return res.status(403).json({
          error: 'Usage limit exceeded',
          message: `You have reached your ${resource} limit (${check.usage}/${check.limit}). Upgrade your plan to continue.`,
          usage: check.usage,
          limit: check.limit
        });
      }
      
      req.usageCheck = check;
      next();
    } catch (error) {
      console.error('Usage limit check failed:', error);
      next(); // Allow action if check fails
    }
  };
};

module.exports = {
  getLawyerUsage,
  checkUsageLimit,
  incrementUsage,
  decrementUsage,
  enforceUsageLimit
};