exports.up = function(knex) {
  return Promise.all([
    // Roles table
    knex.schema.createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('description');
      table.integer('level').defaultTo(0); // Role hierarchy
      table.timestamps(true, true);
    }),

    // Permissions table
    knex.schema.createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('resource').notNullable();
      table.string('action').notNullable();
      table.string('description');
      table.timestamps(true, true);
    }),

    // Role-Permission junction table
    knex.schema.createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
      table.unique(['role_id', 'permission_id']);
      table.timestamps(true, true);
    }),

    // User-Role junction table
    knex.schema.createTable('user_roles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('user_type').notNullable(); // 'user' or 'lawyer'
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.json('context'); // For ABAC - context-aware permissions
      table.timestamp('expires_at').nullable();
      table.unique(['user_id', 'user_type', 'role_id']);
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('user_roles'),
    knex.schema.dropTable('role_permissions'),
    knex.schema.dropTable('permissions'),
    knex.schema.dropTable('roles')
  ]);
};