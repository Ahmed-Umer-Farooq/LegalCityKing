const db = require('./db');

async function fixAdminPermissions() {
  console.log('🔧 Fixing RBAC permissions for admin roles...\n');

  try {
    // Get admin roles
    const adminRoles = await db('roles').whereIn('name', ['admin', 'super_admin']).select();
    
    if (adminRoles.length === 0) {
      console.log('❌ No admin roles found');
      return;
    }

    console.log(`✅ Found admin roles: ${adminRoles.map(r => r.name).join(', ')}`);

    // Admin permissions - comprehensive access
    const adminPermissions = [
      { action: 'manage', resource: 'all' },
      { action: 'read', resource: 'users' },
      { action: 'write', resource: 'users' },
      { action: 'manage', resource: 'users' },
      { action: 'read', resource: 'lawyers' },
      { action: 'write', resource: 'lawyers' },
      { action: 'manage', resource: 'lawyers' },
      { action: 'read', resource: 'cases' },
      { action: 'write', resource: 'cases' },
      { action: 'manage', resource: 'cases' },
      { action: 'read', resource: 'tasks' },
      { action: 'write', resource: 'tasks' },
      { action: 'manage', resource: 'tasks' },
      { action: 'read', resource: 'payments' },
      { action: 'write', resource: 'payments' },
      { action: 'manage', resource: 'payments' },
      { action: 'read', resource: 'blogs' },
      { action: 'write', resource: 'blogs' },
      { action: 'manage', resource: 'blogs' },
      { action: 'read', resource: 'system' },
      { action: 'write', resource: 'system' },
      { action: 'manage', resource: 'system' }
    ];

    for (const role of adminRoles) {
      console.log(`\nProcessing role: ${role.name}`);
      
      for (const perm of adminPermissions) {
        // Check if permission exists
        let permission = await db('permissions')
          .where({ action: perm.action, resource: perm.resource })
          .first();

        if (!permission) {
          // Create permission
          const [permId] = await db('permissions').insert({
            action: perm.action,
            resource: perm.resource,
            name: `${perm.action}_${perm.resource}`
          });
          permission = { id: permId };
          console.log(`  ✅ Created permission: ${perm.action}:${perm.resource}`);
        }

        // Check if role has this permission
        const roleHasPerm = await db('role_permissions')
          .where({ role_id: role.id, permission_id: permission.id })
          .first();

        if (!roleHasPerm) {
          await db('role_permissions').insert({
            role_id: role.id,
            permission_id: permission.id
          });
          console.log(`  ✅ Assigned ${perm.action}:${perm.resource} to ${role.name}`);
        }
      }
    }

    console.log('\n🎉 Admin RBAC permissions fixed!');
    console.log('Admins now have full system access.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixAdminPermissions();