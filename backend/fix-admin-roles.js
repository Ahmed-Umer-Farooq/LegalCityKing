require('dotenv').config();
const db = require('./db');

async function fixAdminRoles() {
  try {
    console.log('=== Fixing Admin Roles ===\n');

    // Get admin role ID
    const adminRole = await db('roles').where('name', 'admin').first();
    if (!adminRole) {
      console.log('❌ Admin role not found in roles table!');
      return;
    }

    console.log(`✅ Found admin role (ID: ${adminRole.id})\n`);

    // Get all admin users
    const admins = await db('users')
      .where('is_admin', 1)
      .select('id', 'name', 'email');

    console.log(`Found ${admins.length} admin user(s):\n`);

    for (const admin of admins) {
      console.log(`Processing: ${admin.name} (${admin.email})`);

      // Check if already has role
      const existing = await db('user_roles')
        .where({
          user_id: admin.id,
          user_type: 'user',
          role_id: adminRole.id
        })
        .first();

      if (existing) {
        console.log('  ⚠️  Already has admin role');
      } else {
        // Assign admin role
        await db('user_roles').insert({
          user_id: admin.id,
          user_type: 'user',
          role_id: adminRole.id
        });
        console.log('  ✅ Admin role assigned successfully');
      }
    }

    console.log('\n=== Verification ===\n');

    // Verify permissions
    for (const admin of admins) {
      const permissions = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('role_permissions', 'roles.id', 'role_permissions.role_id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('user_roles.user_id', admin.id)
        .where('user_roles.user_type', 'user')
        .select('permissions.name', 'permissions.action', 'permissions.resource');

      console.log(`${admin.name}: ${permissions.length} permissions`);
    }

    console.log('\n✅ Admin roles fixed successfully!');
    console.log('Admin users can now access analytics endpoints.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

fixAdminRoles();
