const db = require('./db');

async function addUserCasePermissions() {
  try {
    console.log('🔍 Checking existing permissions...');
    
    // Check if permissions already exist
    const existing = await db('permissions')
      .whereIn('name', ['user.cases.write', 'user.cases.delete'])
      .select('name');
    
    console.log('Existing permissions:', existing.map(p => p.name));
    
    const permissionsToAdd = [];
    if (!existing.find(p => p.name === 'user.cases.write')) {
      permissionsToAdd.push({
        name: 'user.cases.write',
        resource: 'cases',
        action: 'write',
        description: 'Create and edit own cases'
      });
    }
    
    if (!existing.find(p => p.name === 'user.cases.delete')) {
      permissionsToAdd.push({
        name: 'user.cases.delete',
        resource: 'cases',
        action: 'delete',
        description: 'Delete own cases'
      });
    }
    
    if (permissionsToAdd.length === 0) {
      console.log('✅ All permissions already exist');
      return;
    }
    
    console.log('➕ Adding permissions:', permissionsToAdd.map(p => p.name));
    
    // Add new permissions
    const newPermissionIds = await db('permissions')
      .insert(permissionsToAdd)
      .returning('id');
    
    console.log('📝 Added permission IDs:', newPermissionIds);
    
    // Get user role
    const userRole = await db('roles').where('name', 'user').first();
    
    if (!userRole) {
      console.error('❌ User role not found');
      return;
    }
    
    console.log('👤 User role ID:', userRole.id);
    
    // Assign permissions to user role
    const rolePermissions = newPermissionIds.map(id => ({
      role_id: userRole.id,
      permission_id: Array.isArray(id) ? id[0] : id
    }));
    
    await db('role_permissions').insert(rolePermissions);
    
    console.log('✅ Successfully added user case permissions!');
    
    // Verify the permissions
    const userPermissions = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', userRole.id)
      .where('permissions.resource', 'cases')
      .select('permissions.name', 'permissions.action');
    
    console.log('🔐 User case permissions:', userPermissions);
    
  } catch (error) {
    console.error('❌ Error adding permissions:', error.message);
  } finally {
    await db.destroy();
  }
}

addUserCasePermissions();