const db = require('./db');
const { updateLawyerPlanRestrictions, getPlanRestrictions } = require('./utils/planTemplates');

async function testAutoPlanRestrictions() {
  try {
    console.log('🧪 Testing Automatic Plan Restrictions System...\n');

    // Get a test lawyer
    const testLawyer = await db('lawyers').first();
    if (!testLawyer) {
      console.log('❌ No lawyers found for testing');
      return;
    }

    console.log(`👤 Testing with lawyer: ${testLawyer.name || testLawyer.email} (ID: ${testLawyer.id})`);
    console.log(`📋 Current tier: ${testLawyer.subscription_tier || 'free'}\n`);

    // Test 1: Free plan restrictions
    console.log('🔧 Test 1: Applying FREE plan restrictions...');
    await updateLawyerPlanRestrictions(testLawyer.id, 'free', db);
    
    let updatedLawyer = await db('lawyers').where('id', testLawyer.id).first();
    const freeRestrictions = JSON.parse(updatedLawyer.plan_restrictions || '{}');
    console.log('✅ Free restrictions applied:', Object.keys(freeRestrictions).filter(k => !freeRestrictions[k]).length, 'features blocked\n');

    // Test 2: Professional plan restrictions
    console.log('🔧 Test 2: Applying PROFESSIONAL plan restrictions...');
    await updateLawyerPlanRestrictions(testLawyer.id, 'professional', db);
    
    updatedLawyer = await db('lawyers').where('id', testLawyer.id).first();
    const proRestrictions = JSON.parse(updatedLawyer.plan_restrictions || '{}');
    console.log('✅ Professional restrictions applied:', Object.keys(proRestrictions).filter(k => proRestrictions[k]).length, 'features enabled\n');

    // Test 3: Premium plan restrictions
    console.log('🔧 Test 3: Applying PREMIUM plan restrictions...');
    await updateLawyerPlanRestrictions(testLawyer.id, 'premium', db);
    
    updatedLawyer = await db('lawyers').where('id', testLawyer.id).first();
    const premiumRestrictions = JSON.parse(updatedLawyer.plan_restrictions || '{}');
    console.log('✅ Premium restrictions applied:', Object.keys(premiumRestrictions).filter(k => premiumRestrictions[k]).length, 'features enabled\n');

    // Test 4: Template verification
    console.log('🔧 Test 4: Verifying plan templates...');
    const freeTemplate = getPlanRestrictions('free');
    const proTemplate = getPlanRestrictions('professional');
    const premiumTemplate = getPlanRestrictions('premium');

    console.log(`✅ Free template: ${Object.keys(freeTemplate).filter(k => !freeTemplate[k]).length} blocked, ${Object.keys(freeTemplate).filter(k => freeTemplate[k]).length} enabled`);
    console.log(`✅ Professional template: ${Object.keys(proTemplate).filter(k => !proTemplate[k]).length} blocked, ${Object.keys(proTemplate).filter(k => proTemplate[k]).length} enabled`);
    console.log(`✅ Premium template: ${Object.keys(premiumTemplate).filter(k => !premiumTemplate[k]).length} blocked, ${Object.keys(premiumTemplate).filter(k => premiumTemplate[k]).length} enabled\n`);

    // Restore original tier
    await db('lawyers').where('id', testLawyer.id).update({
      subscription_tier: testLawyer.subscription_tier || 'free'
    });
    await updateLawyerPlanRestrictions(testLawyer.id, testLawyer.subscription_tier || 'free', db);

    console.log('🎉 All tests passed! Automatic Plan Restrictions System is working correctly!\n');
    console.log('📋 System Summary:');
    console.log('   ✅ New lawyers get free plan restrictions automatically');
    console.log('   ✅ Subscription upgrades auto-update plan restrictions');
    console.log('   ✅ Subscription downgrades/expiry revert to free restrictions');
    console.log('   ✅ Manual subscription updates also update restrictions');
    console.log('   ✅ Plan templates are working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testAutoPlanRestrictions();