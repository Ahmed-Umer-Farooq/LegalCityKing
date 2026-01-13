const db = require('./db');

async function fixRBACPermissions() {
  console.log('🔧 Fixing RBAC permissions for user role...\n');

  try {
    // Get user role
    const userRole = await db('roles').where('name', 'user').first();
    if (!userRole) {
      console.log('❌ User role not found');
      return;
    }

    console.log(`✅ Found user role: ${userRole.name} (ID: ${userRole.id})`);

    // Check existing permissions
    const existingPerms = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', userRole.id)
      .select('permissions.action', 'permissions.resource');

    console.log('Current permissions:', existingPerms.map(p => `${p.action}:${p.resource}`));

    // Required permissions for users
    const requiredPermissions = [
      { action: 'read', resource: 'cases' },
      { action: 'write', resource: 'cases' },
      { action: 'read', resource: 'tasks' },
      { action: 'write', resource: 'tasks' },
      { action: 'read', resource: 'appointments' },
      { action: 'write', resource: 'appointments' }
    ];

    for (const perm of requiredPermissions) {
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
        console.log(`✅ Created permission: ${perm.action}:${perm.resource}`);
      }

      // Check if role has this permission
      const roleHasPerm = await db('role_permissions')
        .where({ role_id: userRole.id, permission_id: permission.id })
        .first();

      if (!roleHasPerm) {
        await db('role_permissions').insert({
          role_id: userRole.id,
          permission_id: permission.id
        });
        console.log(`✅ Assigned ${perm.action}:${perm.resource} to user role`);
      }
    }

    console.log('\n🎉 RBAC permissions fixed!');
    console.log('User role now has access to cases and tasks.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixRBACPermissions();