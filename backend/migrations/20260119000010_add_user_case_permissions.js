exports.up = async function(knex) {
  // Add missing user case permissions
  const newPermissions = await knex('permissions').insert([
    { name: 'user.cases.write', resource: 'cases', action: 'write', description: 'Create and edit own cases' },
    { name: 'user.cases.delete', resource: 'cases', action: 'delete', description: 'Delete own cases' }
  ]).returning('id');

  // Get user role ID
  const userRole = await knex('roles').where('name', 'user').first();
  
  if (userRole) {
    // Assign new permissions to user role
    const rolePermissions = newPermissions.map(permId => ({
      role_id: userRole.id,
      permission_id: Array.isArray(permId) ? permId[0] : permId
    }));
    
    await knex('role_permissions').insert(rolePermissions);
  }
};

exports.down = async function(knex) {
  // Remove the permissions
  const permissions = await knex('permissions')
    .whereIn('name', ['user.cases.write', 'user.cases.delete'])
    .select('id');
  
  if (permissions.length > 0) {
    const permissionIds = permissions.map(p => p.id);
    await knex('role_permissions').whereIn('permission_id', permissionIds).del();
    await knex('permissions').whereIn('id', permissionIds).del();
  }
};