/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if columns already exist before adding
  const hasIsAdmin = await knex.schema.hasColumn('users', 'is_admin');
  const hasLastLogin = await knex.schema.hasColumn('users', 'last_login');
  
  if (!hasIsAdmin || !hasLastLogin) {
    await knex.schema.table('users', function(table) {
      if (!hasIsAdmin) {
        table.boolean('is_admin').defaultTo(false);
      }
      if (!hasLastLogin) {
        table.timestamp('last_login').nullable();
      }
    });
  }

  // Create activity logs table if it doesn't exist
  const hasActivityLogs = await knex.schema.hasTable('activity_logs');
  
  if (!hasActivityLogs) {
    await knex.schema.createTable('activity_logs', function(table) {
      table.increments('id').primary();
      table.integer('admin_id').unsigned().nullable();
      table.string('action', 255).notNullable();
      table.string('target_type', 50).nullable();
      table.integer('target_id').unsigned().nullable();
      table.text('details').nullable();
      table.string('ip_address', 45).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index(['admin_id', 'created_at']);
      table.index('target_type');
    });
  }

  console.log('✅ Admin system migration completed successfully');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop activity logs table
  await knex.schema.dropTableIfExists('activity_logs');
  
  // Remove admin columns from users table
  const hasIsAdmin = await knex.schema.hasColumn('users', 'is_admin');
  const hasLastLogin = await knex.schema.hasColumn('users', 'last_login');
  
  if (hasIsAdmin || hasLastLogin) {
    await knex.schema.table('users', function(table) {
      if (hasIsAdmin) {
        table.dropColumn('is_admin');
      }
      if (hasLastLogin) {
        table.dropColumn('last_login');
      }
    });
  }

  console.log('✅ Admin system migration rolled back successfully');
};
