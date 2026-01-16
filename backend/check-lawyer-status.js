require('dotenv').config();
const db = require('./db');

async function checkLawyerStatus() {
  try {
    console.log('=== Checking Lawyer Status ===\n');

    const lawyer = await db('lawyers')
      .where('id', 44)
      .orWhere('email', 'tbumer38@gmail.com')
      .first();

    if (!lawyer) {
      console.log('❌ Lawyer not found!');
      return;
    }

    console.log('Lawyer Info:');
    console.log('  ID:', lawyer.id);
    console.log('  Name:', lawyer.name);
    console.log('  Email:', lawyer.email);
    console.log('  Registration ID:', lawyer.registration_id);
    console.log('\nVerification Status:');
    console.log('  is_verified:', lawyer.is_verified);
    console.log('  verification_status:', lawyer.verification_status);
    console.log('  email_verified:', lawyer.email_verified);
    console.log('\nSubscription Details:');
    console.log('  subscription_tier:', lawyer.subscription_tier);
    console.log('  subscription_status:', lawyer.subscription_status);
    console.log('  subscription_expires_at:', lawyer.subscription_expires_at);
    console.log('  stripe_subscription_id:', lawyer.stripe_subscription_id);
    console.log('\nStripe Connect:');
    console.log('  stripe_account_id:', lawyer.stripe_account_id);
    console.log('  stripe_onboarding_complete:', lawyer.stripe_onboarding_complete);
    console.log('\nAccount Status:');
    console.log('  account_locked:', lawyer.account_locked);
    console.log('  profile_completed:', lawyer.profile_completed);

    // Check if subscription is expired
    if (lawyer.subscription_expires_at) {
      const expiryDate = new Date(lawyer.subscription_expires_at);
      const now = new Date();
      const isExpired = expiryDate < now;
      console.log('\nSubscription Expiry Check:');
      console.log('  Expires:', expiryDate.toISOString());
      console.log('  Now:', now.toISOString());
      console.log('  Is Expired:', isExpired ? '❌ YES' : '✅ NO');
    }

    // Check RBAC roles
    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', lawyer.id)
      .where('user_roles.user_type', 'lawyer')
      .select('roles.name', 'roles.description');

    console.log('\nRBAC Roles:', roles.length > 0 ? roles.map(r => r.name).join(', ') : 'None');

    // Identify issues
    console.log('\n=== Issues Found ===');
    const issues = [];

    if (!lawyer.is_verified && lawyer.verification_status !== 'approved') {
      issues.push('❌ Not verified (is_verified=false or verification_status != approved)');
    }
    if (lawyer.subscription_status !== 'active') {
      issues.push(`❌ Subscription not active (status: ${lawyer.subscription_status})`);
    }
    if (!lawyer.subscription_tier || lawyer.subscription_tier === 'free') {
      issues.push(`❌ No paid subscription tier (tier: ${lawyer.subscription_tier || 'none'})`);
    }
    if (lawyer.subscription_expires_at) {
      const expiryDate = new Date(lawyer.subscription_expires_at);
      if (expiryDate < new Date()) {
        issues.push('❌ Subscription expired');
      }
    }
    if (roles.length === 0) {
      issues.push('❌ No RBAC roles assigned');
    }

    if (issues.length > 0) {
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No issues found - features should be unlocked');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkLawyerStatus();
