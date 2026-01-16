require('dotenv').config();
const db = require('./db');

async function checkAdminPermissions() {
  try {
    console.log('=== Checking Admin Permissions ===\n');

    // Get all admin users
    const admins = await db('users')
      .where('is_admin', 1)
      .select('id', 'name', 'email', 'is_admin');

    console.log('Admin Users:', admins);

    if (admins.length === 0) {
      console.log('\n❌ No admin users found!');
      return;
    }

    // Check RBAC roles for each admin
    for (const admin of admins) {
      console.log(`\n--- Checking ${admin.name} (ID: ${admin.id}) ---`);
      
      const userRoles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', admin.id)
        .where('user_roles.user_type', 'user')
        .select('roles.name', 'roles.description', 'roles.level');

      console.log('Assigned Roles:', userRoles);

      if (userRoles.length === 0) {
        console.log('⚠️  No RBAC roles assigned!');
        console.log('   This admin needs an "admin" or "super_admin" role in user_roles table');
      } else {
        const hasAdminRole = userRoles.some(r => r.name === 'admin' || r.name === 'super_admin');
        if (hasAdminRole) {
          console.log('✅ Has admin role');
        } else {
          console.log('❌ Missing admin role - only has:', userRoles.map(r => r.name).join(', '));
        }
      }

      // Check permissions
      const permissions = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('role_permissions', 'roles.id', 'role_permissions.role_id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('user_roles.user_id', admin.id)
        .where('user_roles.user_type', 'user')
        .select('permissions.name', 'permissions.action', 'permissions.resource');

      console.log(`Total Permissions: ${permissions.length}`);
      
      const hasManageAll = permissions.some(p => p.action === 'manage' && p.resource === 'all');
      if (hasManageAll) {
        console.log('✅ Has "manage all" permission (super admin)');
      }
    }

    console.log('\n=== Summary ===');
    console.log('Issue: Admin routes require "manage all" permission');
    console.log('Solution: Assign "admin" or "super_admin" role to admin users in user_roles table');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkAdminPermissions();
