exports.up = async function(knex) {
  // Insert Roles
  const roles = await knex('roles').insert([
    { name: 'super_admin', description: 'Super Administrator', level: 100 },
    { name: 'admin', description: 'Administrator', level: 90 },
    { name: 'lawyer', description: 'Lawyer', level: 50 },
    { name: 'verified_lawyer', description: 'Verified Lawyer', level: 60 },
    { name: 'premium_lawyer', description: 'Premium Lawyer', level: 70 },
    { name: 'user', description: 'Regular User', level: 10 },
    { name: 'client', description: 'Client', level: 5 }
  ]).returning('id');

  // Insert Permissions
  const permissions = await knex('permissions').insert([
    // Admin permissions
    { name: 'admin.users.read', resource: 'users', action: 'read', description: 'View all users' },
    { name: 'admin.users.write', resource: 'users', action: 'write', description: 'Manage users' },
    { name: 'admin.lawyers.read', resource: 'lawyers', action: 'read', description: 'View all lawyers' },
    { name: 'admin.lawyers.write', resource: 'lawyers', action: 'write', description: 'Manage lawyers' },
    { name: 'admin.payments.read', resource: 'payments', action: 'read', description: 'View all payments' },
    
    // Lawyer permissions
    { name: 'lawyer.cases.read', resource: 'cases', action: 'read', description: 'View own cases' },
    { name: 'lawyer.cases.write', resource: 'cases', action: 'write', description: 'Manage own cases' },
    { name: 'lawyer.clients.read', resource: 'clients', action: 'read', description: 'View own clients' },
    { name: 'lawyer.clients.write', resource: 'clients', action: 'write', description: 'Manage own clients' },
    { name: 'lawyer.payments.read', resource: 'payments', action: 'read', description: 'View own payments' },
    { name: 'lawyer.payments.write', resource: 'payments', action: 'write', description: 'Create payment links' },
    { name: 'lawyer.documents.read', resource: 'documents', action: 'read', description: 'View own documents' },
    { name: 'lawyer.documents.write', resource: 'documents', action: 'write', description: 'Manage own documents' },
    { name: 'lawyer.blogs.write', resource: 'blogs', action: 'write', description: 'Create blogs' },
    
    // User permissions
    { name: 'user.profile.read', resource: 'profile', action: 'read', description: 'View own profile' },
    { name: 'user.profile.write', resource: 'profile', action: 'write', description: 'Edit own profile' },
    { name: 'user.payments.read', resource: 'payments', action: 'read', description: 'View own payments' },
    { name: 'user.payments.write', resource: 'payments', action: 'write', description: 'Make payments' },
    { name: 'user.cases.read', resource: 'cases', action: 'read', description: 'View own cases' },
    { name: 'user.documents.read', resource: 'documents', action: 'read', description: 'View own documents' },
    
    // Client permissions (limited)
    { name: 'client.payments.read', resource: 'payments', action: 'read', description: 'View assigned payments' },
    { name: 'client.payments.write', resource: 'payments', action: 'write', description: 'Make assigned payments' }
  ]).returning('id');

  // Get role IDs
  const roleMap = await knex('roles').select('id', 'name');
  const permissionMap = await knex('permissions').select('id', 'name');
  
  const getRoleId = (name) => roleMap.find(r => r.name === name)?.id;
  const getPermId = (name) => permissionMap.find(p => p.name === name)?.id;

  // Assign permissions to roles
  const rolePermissions = [
    // Super Admin - all permissions
    ...permissionMap.map(p => ({ role_id: getRoleId('super_admin'), permission_id: p.id })),
    
    // Admin permissions
    { role_id: getRoleId('admin'), permission_id: getPermId('admin.users.read') },
    { role_id: getRoleId('admin'), permission_id: getPermId('admin.users.write') },
    { role_id: getRoleId('admin'), permission_id: getPermId('admin.lawyers.read') },
    { role_id: getRoleId('admin'), permission_id: getPermId('admin.lawyers.write') },
    { role_id: getRoleId('admin'), permission_id: getPermId('admin.payments.read') },
    
    // Lawyer permissions
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.cases.read') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.cases.write') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.clients.read') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.clients.write') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.documents.read') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.documents.write') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('user.profile.read') },
    { role_id: getRoleId('lawyer'), permission_id: getPermId('user.profile.write') },
    
    // Verified Lawyer (inherits lawyer + payment permissions)
    { role_id: getRoleId('verified_lawyer'), permission_id: getPermId('lawyer.payments.read') },
    { role_id: getRoleId('verified_lawyer'), permission_id: getPermId('lawyer.payments.write') },
    { role_id: getRoleId('verified_lawyer'), permission_id: getPermId('lawyer.blogs.write') },
    
    // User permissions
    { role_id: getRoleId('user'), permission_id: getPermId('user.profile.read') },
    { role_id: getRoleId('user'), permission_id: getPermId('user.profile.write') },
    { role_id: getRoleId('user'), permission_id: getPermId('user.payments.read') },
    { role_id: getRoleId('user'), permission_id: getPermId('user.payments.write') },
    { role_id: getRoleId('user'), permission_id: getPermId('user.cases.read') },
    { role_id: getRoleId('user'), permission_id: getPermId('user.documents.read') },
    
    // Client permissions
    { role_id: getRoleId('client'), permission_id: getPermId('client.payments.read') },
    { role_id: getRoleId('client'), permission_id: getPermId('client.payments.write') }
  ];

  await knex('role_permissions').insert(rolePermissions);
};

exports.down = function(knex) {
  return Promise.all([
    knex('role_permissions').del(),
    knex('permissions').del(),
    knex('roles').del()
  ]);
};