const db = require('./db');

async function verifyLawyerAccess() {
  console.log('🔍 VERIFYING LAWYER DASHBOARD ACCESS\n');

  try {
    // 1. Check approved lawyers
    const approvedLawyers = await db('lawyers')
      .where('verification_status', 'approved')
      .select('id', 'name', 'email', 'is_verified');
    
    console.log(`✅ Found ${approvedLawyers.length} approved lawyers\n`);

    // 2. Check verified_lawyer role exists
    const verifiedRole = await db('roles').where('name', 'verified_lawyer').first();
    if (!verifiedRole) {
      console.log('❌ CRITICAL: verified_lawyer role not found!\n');
      return;
    }
    console.log(`✅ verified_lawyer role exists (ID: ${verifiedRole.id})\n`);

    // 3. Check permissions for verified_lawyer role
    const permissions = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', verifiedRole.id)
      .select('permissions.action', 'permissions.resource');
    
    console.log(`📋 Verified Lawyer Permissions (${permissions.length} total):`);
    const requiredPerms = ['dashboard', 'cases', 'clients', 'appointments', 'documents', 'invoices', 'profile', 'events'];
    requiredPerms.forEach(resource => {
      const hasRead = permissions.some(p => p.resource === resource && p.action === 'read');
      console.log(`  ${hasRead ? '✅' : '❌'} read:${resource}`);
    });
    console.log();

    // 4. Check role assignments for each approved lawyer
    console.log('👥 LAWYER ROLE ASSIGNMENTS:');
    for (const lawyer of approvedLawyers) {
      const userRole = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where({ user_id: lawyer.id, user_type: 'lawyer' })
        .select('roles.name');
      
      const hasVerifiedRole = userRole.some(r => r.name === 'verified_lawyer');
      console.log(`  ${hasVerifiedRole ? '✅' : '❌'} ${lawyer.name} (${lawyer.email})`);
      if (!hasVerifiedRole) {
        console.log(`     Assigned roles: ${userRole.map(r => r.name).join(', ') || 'NONE'}`);
      }
    }
    console.log();

    // 5. Summary
    const missingRoles = [];
    for (const lawyer of approvedLawyers) {
      const userRole = await db('user_roles')
        .where({ user_id: lawyer.id, user_type: 'lawyer', role_id: verifiedRole.id })
        .first();
      if (!userRole) missingRoles.push(lawyer);
    }

    if (missingRoles.length === 0) {
      console.log('🎉 ALL CHECKS PASSED! Dashboard access should work.\n');
    } else {
      console.log(`⚠️  ${missingRoles.length} lawyer(s) missing verified_lawyer role\n`);
      console.log('Run: node backend/fix-lawyer-dashboard-access.js\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyLawyerAccess();
