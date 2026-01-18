exports.up = async function(knex) {
  console.log('🔧 Fixing RBAC permissions for free plan lawyers...');

  // Get the lawyer role
  const lawyerRole = await knex('roles').where('name', 'lawyer').first();
  if (!lawyerRole) {
    console.log('❌ Lawyer role not found, skipping...');
    return;
  }

  // Define all permissions that free plan lawyers should have
  const requiredPermissions = [
    // Basic dashboard and profile
    { name: 'lawyer.dashboard.read', resource: 'dashboard', action: 'read', description: 'View dashboard' },
    { name: 'lawyer.profile.read', resource: 'profile', action: 'read', description: 'View own profile' },
    { name: 'lawyer.profile.write', resource: 'profile', action: 'write', description: 'Edit own profile' },
    
    // Cases - core functionality
    { name: 'lawyer.cases.read', resource: 'cases', action: 'read', description: 'View own cases' },
    { name: 'lawyer.cases.write', resource: 'cases', action: 'write', description: 'Manage own cases' },
    
    // Clients - core functionality
    { name: 'lawyer.clients.read', resource: 'clients', action: 'read', description: 'View own clients' },
    { name: 'lawyer.clients.write', resource: 'clients', action: 'write', description: 'Manage own clients' },
    
    // Documents - core functionality
    { name: 'lawyer.documents.read', resource: 'documents', action: 'read', description: 'View own documents' },
    { name: 'lawyer.documents.write', resource: 'documents', action: 'write', description: 'Manage own documents' },
    
    // Notes - basic functionality
    { name: 'lawyer.notes.read', resource: 'notes', action: 'read', description: 'View own notes' },
    { name: 'lawyer.notes.write', resource: 'notes', action: 'write', description: 'Manage own notes' },
    
    // Events - basic functionality
    { name: 'lawyer.events.read', resource: 'events', action: 'read', description: 'View own events' },
    { name: 'lawyer.events.write', resource: 'events', action: 'write', description: 'Manage own events' },
    
    // Tasks - basic functionality
    { name: 'lawyer.tasks.read', resource: 'tasks', action: 'read', description: 'View own tasks' },
    { name: 'lawyer.tasks.write', resource: 'tasks', action: 'write', description: 'Manage own tasks' },
    
    // Contacts - basic functionality
    { name: 'lawyer.contacts.read', resource: 'contacts', action: 'read', description: 'View own contacts' },
    { name: 'lawyer.contacts.write', resource: 'contacts', action: 'write', description: 'Manage own contacts' },
    
    // Calls - basic functionality
    { name: 'lawyer.calls.read', resource: 'calls', action: 'read', description: 'View own calls' },
    { name: 'lawyer.calls.write', resource: 'calls', action: 'write', description: 'Manage own calls' },
    
    // Appointments - basic functionality
    { name: 'lawyer.appointments.read', resource: 'appointments', action: 'read', description: 'View own appointments' },
    { name: 'lawyer.appointments.write', resource: 'appointments', action: 'write', description: 'Manage own appointments' },
    
    // Invoices - basic read access
    { name: 'lawyer.invoices.read', resource: 'invoices', action: 'read', description: 'View own invoices' }
  ];

  console.log(`📝 Processing ${requiredPermissions.length} permissions...`);

  for (const perm of requiredPermissions) {
    // Check if permission exists
    let permission = await knex('permissions').where('name', perm.name).first();
    
    if (!permission) {
      // Create the permission
      const [permId] = await knex('permissions').insert({
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        description: perm.description
      });
      permission = { id: permId };
      console.log(`   ✅ Created permission: ${perm.name}`);
    }

    // Check if lawyer role has this permission
    const roleHasPermission = await knex('role_permissions')
      .where('role_id', lawyerRole.id)
      .where('permission_id', permission.id)
      .first();

    if (!roleHasPermission) {
      // Assign permission to lawyer role
      await knex('role_permissions').insert({
        role_id: lawyerRole.id,
        permission_id: permission.id
      });
      console.log(`   ✅ Assigned ${perm.name} to lawyer role`);
    }
  }

  // Ensure all lawyers have the lawyer role assigned
  const lawyersWithoutRole = await knex('lawyers')
    .leftJoin('user_roles', function() {
      this.on('lawyers.id', '=', 'user_roles.user_id')
          .andOn('user_roles.user_type', '=', knex.raw('?', ['lawyer']));
    })
    .whereNull('user_roles.id')
    .select('lawyers.id', 'lawyers.name', 'lawyers.email');

  console.log(`👥 Found ${lawyersWithoutRole.length} lawyers without role assignment`);

  for (const lawyer of lawyersWithoutRole) {
    try {
      await knex('user_roles').insert({
        user_id: lawyer.id,
        user_type: 'lawyer',
        role_id: lawyerRole.id
      });
      console.log(`   ✅ Assigned lawyer role to: ${lawyer.name || lawyer.email}`);
    } catch (error) {
      // Ignore duplicate entries
      if (!error.message.includes('UNIQUE constraint')) {
        console.log(`   ⚠️  Error assigning role to ${lawyer.name || lawyer.email}: ${error.message}`);
      }
    }
  }

  console.log('🎉 RBAC permissions fix completed!');
};

exports.down = function(knex) {
  // This migration only adds permissions, no rollback needed
  return Promise.resolve();
};