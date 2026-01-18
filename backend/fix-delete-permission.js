const db = require('./db');

async function fixDeletePermission() {
  try {
    console.log('🔧 Fixing delete permission...');
    
    // First, ensure the permission exists
    let deletePermission = await db('permissions').where('name', 'user.cases.delete').first();
    
    if (!deletePermission) {
      console.log('➕ Creating delete permission...');
      await db('permissions').insert({
        name: 'user.cases.delete',
        resource: 'cases',
        action: 'delete',
        description: 'Delete own cases'
      });
      deletePermission = await db('permissions').where('name', 'user.cases.delete').first();
    }
    
    console.log('✅ Delete permission exists:', deletePermission);
    
    // Get user role
    const userRole = await db('roles').where('name', 'user').first();
    console.log('👤 User role:', userRole);
    
    // Check if role permission exists
    const rolePermission = await db('role_permissions')
      .where('role_id', userRole.id)
      .where('permission_id', deletePermission.id)
      .first();
    
    if (!rolePermission) {
      console.log('🔗 Linking permission to user role...');
      await db('role_permissions').insert({
        role_id: userRole.id,
        permission_id: deletePermission.id
      });
    }
    
    // Verify all user case permissions
    const userCasePermissions = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', userRole.id)
      .where('permissions.resource', 'cases')
      .select('permissions.name', 'permissions.action');
    
    console.log('🔐 User case permissions:');
    userCasePermissions.forEach(p => console.log(`  - ${p.name} (${p.action})`));
    
    console.log('✅ Delete permission fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

fixDeletePermission();