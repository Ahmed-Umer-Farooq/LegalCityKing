const db = require('./db');

async function applyDefaultPlanRestrictions() {
  try {
    console.log('🔧 Applying default plan restrictions to existing lawyers...\n');

    // Get lawyers without plan restrictions
    const lawyersWithoutRestrictions = await db('lawyers')
      .whereNull('plan_restrictions')
      .orWhere('plan_restrictions', '')
      .select('id', 'name', 'email', 'subscription_tier');

    console.log(`Found ${lawyersWithoutRestrictions.length} lawyers without plan restrictions\n`);

    // Default restrictions for each plan
    const planRestrictions = {
      free: {
        messages: false,
        contacts: false,
        calendar: false,
        payment_records: false,
        tasks: false,
        documents: false,
        reports: false,
        blogs: false,
        forms: false,
        payouts: false,
        payment_links: false,
        qa_answers: false,
        ai_analyzer: false,
        quick_actions: false
      },
      professional: {
        messages: true,
        contacts: true,
        calendar: true,
        payment_records: true,
        tasks: true,
        documents: true,
        reports: true,
        blogs: true,
        forms: false, // Premium only
        payouts: true,
        payment_links: true,
        qa_answers: true,
        ai_analyzer: true,
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

    for (const lawyer of lawyersWithoutRestrictions) {
      const tier = (lawyer.subscription_tier || 'free').toLowerCase();
      const restrictions = planRestrictions[tier] || planRestrictions.free;

      await db('lawyers')
        .where('id', lawyer.id)
        .update({
          plan_restrictions: JSON.stringify(restrictions),
          subscription_tier: tier // Ensure tier is set
        });

      console.log(`✅ Applied ${tier} plan restrictions to: ${lawyer.name || lawyer.email}`);
    }

    console.log(`\n🎉 Successfully applied default plan restrictions to ${lawyersWithoutRestrictions.length} lawyers!`);
    console.log('\n📋 Summary:');
    console.log('   - Free plan: All features blocked except home, profile, subscription');
    console.log('   - Professional plan: Most features enabled except forms');
    console.log('   - Premium plan: All features enabled');

  } catch (error) {
    console.error('❌ Error applying plan restrictions:', error);
  } finally {
    process.exit(0);
  }
}

applyDefaultPlanRestrictions();