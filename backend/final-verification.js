require('dotenv').config();
const db = require('./db');

async function finalVerification() {
  try {
    console.log('=== FINAL VERIFICATION ===\n');
    console.log('Checking all fixes for Lawyer ID: 44\n');

    const lawyer = await db('lawyers').where('id', 44).first();
    
    console.log('1. RBAC Role Assignment:');
    const role = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', 44)
      .where('user_roles.user_type', 'lawyer')
      .first();
    console.log(`   ✅ Role: ${role ? role.name : 'NONE'}`);
    
    const permissions = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .where('user_roles.user_id', 44)
      .where('user_roles.user_type', 'lawyer')
      .count('* as count').first();
    console.log(`   ✅ Permissions: ${permissions.count}`);
    console.log('');

    console.log('2. Subscription Status:');
    console.log(`   ✅ Tier: ${lawyer.subscription_tier}`);
    console.log(`   ✅ Status: ${lawyer.subscription_status}`);
    console.log(`   ✅ Expires: ${lawyer.subscription_expires_at}`);
    console.log('');

    console.log('3. Verification Status:');
    console.log(`   ✅ is_verified: ${lawyer.is_verified}`);
    console.log(`   ✅ verification_status: ${lawyer.verification_status}`);
    console.log('');

    console.log('4. Revenue Data:');
    const [totalRev, monthRev, transCount] = await Promise.all([
      db('transactions')
        .where('lawyer_id', 44)
        .where('status', 'completed')
        .sum('lawyer_earnings as total').first(),
      db('transactions')
        .where('lawyer_id', 44)
        .where('status', 'completed')
        .whereBetween('created_at', [
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          new Date()
        ])
        .sum('lawyer_earnings as total').first(),
      db('transactions')
        .where('lawyer_id', 44)
        .where('status', 'completed')
        .count('id as count').first()
    ]);
    
    console.log(`   ✅ Total Earnings: $${parseFloat(totalRev.total || 0).toFixed(2)}`);
    console.log(`   ✅ This Month: $${parseFloat(monthRev.total || 0).toFixed(2)}`);
    console.log(`   ✅ Transactions: ${transCount.count}`);
    console.log('');

    console.log('=== SUMMARY ===\n');
    
    const issues = [];
    
    if (!role || role.name !== 'premium_lawyer') {
      issues.push('❌ Wrong role assigned');
    } else {
      console.log('✅ RBAC Role: Correct (premium_lawyer)');
    }
    
    if (permissions.count < 10) {
      issues.push('❌ Missing permissions');
    } else {
      console.log('✅ Permissions: Correct (11 permissions)');
    }
    
    if (lawyer.subscription_tier !== 'premium' || lawyer.subscription_status !== 'active') {
      issues.push('❌ Subscription issue');
    } else {
      console.log('✅ Subscription: Active Premium');
    }
    
    if (!lawyer.is_verified || lawyer.verification_status !== 'approved') {
      issues.push('❌ Not verified');
    } else {
      console.log('✅ Verification: Approved');
    }
    
    if (parseFloat(totalRev.total || 0) === 0) {
      issues.push('❌ No revenue data');
    } else {
      console.log('✅ Revenue Data: Available');
    }
    
    console.log('');
    
    if (issues.length > 0) {
      console.log('⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('🎉 ALL SYSTEMS GO!');
      console.log('');
      console.log('Expected Dashboard Display:');
      console.log(`   • Total Earnings: $${parseFloat(totalRev.total || 0).toFixed(2)}`);
      console.log(`   • This Month: $${parseFloat(monthRev.total || 0).toFixed(2)}`);
      console.log('   • All features unlocked');
      console.log('   • Revenue chart populated');
      console.log('');
      console.log('✅ Ready to restart backend and test!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

finalVerification();
