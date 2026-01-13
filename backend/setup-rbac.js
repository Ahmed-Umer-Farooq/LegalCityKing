const db = require('./db');
const rbacService = require('./services/rbacService');

async function setupRBAC() {
  try {
    console.log('Setting up RBAC system...');

    // Create tables
    await db.schema.dropTableIfExists('user_roles');
    await db.schema.dropTableIfExists('role_permissions');
    await db.schema.dropTableIfExists('permissions');
    await db.schema.dropTableIfExists('roles');

    // Roles table
    await db.schema.createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('description');
      table.integer('level').defaultTo(0);
      table.timestamps(true, true);
    });

    // Permissions table
    await db.schema.createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('resource').notNullable();
      table.string('action').notNullable();
      table.string('description');
      table.timestamps(true, true);
    });

    // Role-Permission junction table
    await db.schema.createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
      table.unique(['role_id', 'permission_id']);
      table.timestamps(true, true);
    });

    // User-Role junction table
    await db.schema.createTable('user_roles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('user_type').notNullable();
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.unique(['user_id', 'user_type', 'role_id']);
      table.timestamps(true, true);
    });

    console.log('✅ Tables created');

    // Insert roles
    await db('roles').insert([
      { name: 'admin', description: 'Administrator', level: 90 },
      { name: 'lawyer', description: 'Lawyer', level: 50 },
      { name: 'verified_lawyer', description: 'Verified Lawyer', level: 60 },
      { name: 'user', description: 'Regular User', level: 10 },
      { name: 'client', description: 'Client', level: 5 }
    ]);

    // Insert permissions
    await db('permissions').insert([
      { name: 'admin.manage', resource: 'admin', action: 'manage', description: 'Admin access' },
      { name: 'lawyer.payments.write', resource: 'payments', action: 'write', description: 'Create payment links' },
      { name: 'lawyer.cases.manage', resource: 'cases', action: 'manage', description: 'Manage cases' },
      { name: 'user.payments.read', resource: 'payments', action: 'read', description: 'View payments' },
      { name: 'user.profile.manage', resource: 'profile', action: 'manage', description: 'Manage profile' }
    ]);

    console.log('✅ Roles and permissions created');

    // Get IDs for role-permission assignments
    const roles = await db('roles').select('id', 'name');
    const permissions = await db('permissions').select('id', 'name');
    
    const getRoleId = (name) => roles.find(r => r.name === name)?.id;
    const getPermId = (name) => permissions.find(p => p.name === name)?.id;

    // Assign permissions to roles
    await db('role_permissions').insert([
      { role_id: getRoleId('admin'), permission_id: getPermId('admin.manage') },
      { role_id: getRoleId('verified_lawyer'), permission_id: getPermId('lawyer.payments.write') },
      { role_id: getRoleId('lawyer'), permission_id: getPermId('lawyer.cases.manage') },
      { role_id: getRoleId('user'), permission_id: getPermId('user.payments.read') },
      { role_id: getRoleId('user'), permission_id: getPermId('user.profile.manage') }
    ]);

    console.log('✅ Role-permission assignments created');

    // Migrate existing users
    await rbacService.migrateExistingUsers();
    console.log('✅ Existing users migrated');

    console.log('🎉 RBAC setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ RBAC setup failed:', error);
    process.exit(1);
  }
}

setupRBAC();