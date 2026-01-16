require('dotenv').config();
const db = require('./db');

async function fixLawyerRole() {
  try {
    console.log('=== Fixing Lawyer RBAC Role ===\n');

    const lawyer = await db('lawyers').where('id', 44).first();
    
    if (!lawyer) {
      console.log('❌ Lawyer not found!');
      return;
    }

    console.log(`Lawyer: ${lawyer.name} (${lawyer.email})`);
    console.log(`Subscription: ${lawyer.subscription_tier} (${lawyer.subscription_status})`);
    console.log(`Verified: ${lawyer.is_verified ? 'Yes' : 'No'}\n`);

    // Determine appropriate role based on subscription and verification
    let roleName = 'lawyer';
    if (lawyer.is_verified || lawyer.verification_status === 'approved') {
      if (lawyer.subscription_tier === 'premium' || lawyer.subscription_tier === 'Premium') {
        roleName = 'premium_lawyer';
      } else {
        roleName = 'verified_lawyer';
      }
    }

    console.log(`Assigning role: ${roleName}\n`);

    const role = await db('roles').where('name', roleName).first();
    if (!role) {
      console.log(`❌ Role ${roleName} not found!`);
      return;
    }

    // Check if already has role
    const existing = await db('user_roles')
      .where({
        user_id: lawyer.id,
        user_type: 'lawyer',
        role_id: role.id
      })
      .first();

    if (existing) {
      console.log(`⚠️  Already has ${roleName} role`);
    } else {
      await db('user_roles').insert({
        user_id: lawyer.id,
        user_type: 'lawyer',
        role_id: role.id
      });
      console.log(`✅ ${roleName} role assigned successfully`);
    }

    // Verify permissions
    const permissions = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', lawyer.id)
      .where('user_roles.user_type', 'lawyer')
      .select('permissions.name', 'permissions.action', 'permissions.resource');

    console.log(`\n✅ Total permissions: ${permissions.length}`);
    console.log('\nKey permissions:');
    permissions.slice(0, 5).forEach(p => {
      console.log(`  - ${p.action} ${p.resource}`);
    });

    console.log('\n✅ Done! Lawyer should now have access to all features.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

fixLawyerRole();
