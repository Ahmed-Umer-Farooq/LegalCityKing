exports.up = async function(knex) {
  // Get role and permission IDs
  const premiumLawyerRole = await knex('roles').where('name', 'premium_lawyer').first();
  const verifiedLawyerRole = await knex('roles').where('name', 'verified_lawyer').first();
  const lawyerRole = await knex('roles').where('name', 'lawyer').first();
  
  if (!premiumLawyerRole) {
    console.log('premium_lawyer role not found');
    return;
  }

  // Get all lawyer-related permissions
  const lawyerPermissions = await knex('permissions')
    .whereIn('name', [
      'lawyer.cases.read',
      'lawyer.cases.write',
      'lawyer.clients.read',
      'lawyer.clients.write',
      'lawyer.payments.read',
      'lawyer.payments.write',
      'lawyer.documents.read',
      'lawyer.documents.write',
      'lawyer.blogs.write',
      'user.profile.read',
      'user.profile.write'
    ])
    .select('id');

  // Assign all lawyer permissions to premium_lawyer
  const rolePermissions = lawyerPermissions.map(perm => ({
    role_id: premiumLawyerRole.id,
    permission_id: perm.id
  }));

  // Insert permissions (ignore duplicates)
  for (const rp of rolePermissions) {
    await knex('role_permissions')
      .insert(rp)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  console.log(`✅ Assigned ${rolePermissions.length} permissions to premium_lawyer role`);
};

exports.down = async function(knex) {
  const premiumLawyerRole = await knex('roles').where('name', 'premium_lawyer').first();
  if (premiumLawyerRole) {
    await knex('role_permissions').where('role_id', premiumLawyerRole.id).del();
  }
};
