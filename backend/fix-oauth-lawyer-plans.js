const db = require('./db');
const { updateLawyerPlanRestrictions } = require('./utils/planTemplates');

async function fixOAuthLawyerPlanRestrictions() {
  try {
    console.log('🔍 Checking OAuth lawyers without plan restrictions...');
    
    // Find OAuth lawyers without plan_restrictions
    const oauthLawyers = await db('lawyers')
      .where('google_id', '!=', null)
      .whereNull('plan_restrictions')
      .orWhere('plan_restrictions', '')
      .select('id', 'email', 'name', 'subscription_tier');
    
    console.log(`Found ${oauthLawyers.length} OAuth lawyers needing plan restrictions`);
    
    if (oauthLawyers.length === 0) {
      console.log('✅ All OAuth lawyers already have plan restrictions');
      return;
    }
    
    // Apply plan restrictions to each lawyer
    for (const lawyer of oauthLawyers) {
      const tier = lawyer.subscription_tier || 'free';
      console.log(`Applying ${tier} plan to lawyer ${lawyer.id} (${lawyer.email})`);
      
      const success = await updateLawyerPlanRestrictions(lawyer.id, tier, db);
      if (success) {
        console.log(`✅ Updated lawyer ${lawyer.id}`);
      } else {
        console.log(`❌ Failed to update lawyer ${lawyer.id}`);
      }
    }
    
    console.log('🎯 OAuth lawyer plan restrictions fix completed');
    
  } catch (error) {
    console.error('❌ Error fixing OAuth lawyer plan restrictions:', error);
  } finally {
    process.exit(0);
  }
}

fixOAuthLawyerPlanRestrictions();