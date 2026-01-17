exports.up = async function(knex) {
  // Ensure roles table exists and has all fields
  const rolesExists = await knex.schema.hasTable('roles');
  if (!rolesExists) {
    await knex.schema.createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('description');
      table.integer('level').defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // Ensure permissions table exists
  const permissionsExists = await knex.schema.hasTable('permissions');
  if (!permissionsExists) {
    await knex.schema.createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('resource').notNullable();
      table.string('action').notNullable();
      table.string('description');
      table.timestamps(true, true);
    });
  }

  // Ensure role_permissions table exists
  const rolePermissionsExists = await knex.schema.hasTable('role_permissions');
  if (!rolePermissionsExists) {
    await knex.schema.createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
      table.unique(['role_id', 'permission_id']);
      table.timestamps(true, true);
    });
  }

  // Ensure user_roles table exists
  const userRolesExists = await knex.schema.hasTable('user_roles');
  if (!userRolesExists) {
    await knex.schema.createTable('user_roles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('user_type').notNullable(); // 'user' or 'lawyer'
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.json('context'); // For ABAC - context-aware permissions
      table.timestamp('expires_at').nullable();
      table.unique(['user_id', 'user_type', 'role_id']);
      table.timestamps(true, true);
    });
  }

  // Ensure payouts table exists and has all fields
  const payoutsExists = await knex.schema.hasTable('payouts');
  if (!payoutsExists) {
    await knex.schema.createTable('payouts', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().notNullable().references('id').inTable('lawyers').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('stripe_payout_id').nullable();
      table.enum('status', ['pending', 'processing', 'paid', 'failed', 'rejected']).defaultTo('pending');
      table.timestamp('requested_at').defaultTo(knex.fn.now());
      table.timestamp('approved_at').nullable();
      table.timestamp('paid_at').nullable();
      table.text('failed_reason').nullable();
      table.integer('approved_by_admin_id').unsigned().nullable();
      table.timestamps(true, true);
    });
  }

  // Ensure platform_earnings table exists
  const platformEarningsExists = await knex.schema.hasTable('platform_earnings');
  if (!platformEarningsExists) {
    await knex.schema.createTable('platform_earnings', function(table) {
      table.increments('id').primary();
      table.date('date').notNullable().unique();
      table.integer('total_transactions').defaultTo(0);
      table.decimal('total_amount', 12, 2).defaultTo(0);
      table.decimal('lawyer_earnings', 12, 2).defaultTo(0);
      table.decimal('platform_fees', 12, 2).defaultTo(0);
      table.decimal('stripe_fees', 12, 2).defaultTo(0);
      table.decimal('net_profit', 12, 2).defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // Ensure activity_logs table exists
  const activityLogsExists = await knex.schema.hasTable('activity_logs');
  if (!activityLogsExists) {
    await knex.schema.createTable('activity_logs', function(table) {
      table.increments('id').primary();
      table.integer('admin_id').unsigned().references('id').inTable('users');
      table.string('action').notNullable();
      table.string('target_type').notNullable();
      table.integer('target_id').unsigned();
      table.text('details');
      table.string('ip_address');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Fix blog_comments to remove user_id FK if exists
  const hasUserIdFK = await knex.schema.hasTable('information_schema.table_constraints') &&
    (await knex.raw(`SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'blog_comments' AND constraint_name LIKE '%user_id%'`)).length > 0;
  if (hasUserIdFK) {
    await knex.schema.alterTable('blog_comments', function(table) {
      table.dropForeign(['user_id']);
    });
  }
};

exports.down = function(knex) {
  // No down migration as this is a fix
  return Promise.resolve();
};
