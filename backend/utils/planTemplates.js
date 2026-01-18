// Plan restriction templates for each subscription tier
const PLAN_TEMPLATES = {
  free: {
    messages: true,
    contacts: true,
    calendar: true,
    payment_records: false,
    tasks: true,
    documents: false,
    reports: false,
    blogs: false,
    forms: false,
    payouts: false,
    payment_links: false,
    qa_answers: true,
    ai_analyzer: false,
    quick_actions: true
  },
  professional: {
    messages: true,
    contacts: true,
    calendar: true,
    payment_records: true,
    tasks: true,
    documents: false,
    reports: true,
    blogs: false,
    forms: false, // Premium only
    payouts: true,
    payment_links: true,
    qa_answers: true,
    ai_analyzer: false,
    quick_actions: true
  },
  premium: {
    messages: true,
    contacts: true,
    calendar: true,
    payment_records: true,
    tasks: true,
    documents: true,
    reports: true,
    blogs: true,
    forms: true,
    payouts: true,
    payment_links: true,
    qa_answers: true,
    ai_analyzer: true,
    quick_actions: true
  }
};

// Function to get plan restrictions for a specific tier
const getPlanRestrictions = (tier) => {
  const normalizedTier = (tier || 'free').toLowerCase();
  return PLAN_TEMPLATES[normalizedTier] || PLAN_TEMPLATES.free;
};

// Function to update lawyer plan restrictions based on subscription tier
const updateLawyerPlanRestrictions = async (lawyerId, newTier, db) => {
  try {
    const restrictions = getPlanRestrictions(newTier);
    
    await db('lawyers')
      .where('id', lawyerId)
      .update({
        plan_restrictions: JSON.stringify(restrictions)
      });
    
    console.log(`✅ Updated plan restrictions for lawyer ${lawyerId} to ${newTier} tier`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update plan restrictions for lawyer ${lawyerId}:`, error);
    return false;
  }
};

module.exports = {
  PLAN_TEMPLATES,
  getPlanRestrictions,
  updateLawyerPlanRestrictions
};