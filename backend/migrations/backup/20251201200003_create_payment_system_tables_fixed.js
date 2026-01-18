exports.up = function(knex) {
  return Promise.all([
    // Add payment fields to lawyers table (excluding hourly_rate which already exists)
    knex.schema.table('lawyers', function(table) {
      table.string('stripe_customer_id').nullable();
      table.string('stripe_subscription_id').nullable();
      table.enum('subscription_tier', ['free', 'professional', 'premium']).defaultTo('free');
      table.enum('subscription_status', ['active', 'canceled', 'past_due', 'trialing']).defaultTo('active');
      table.decimal('consultation_rate', 8, 2).nullable();
      table.timestamp('subscription_created_at').nullable();
      table.timestamp('subscription_expires_at').nullable();
    }),

    // Add payment fields to users table
    knex.schema.table('users', function(table) {
      table.string('stripe_customer_id').nullable();
    }),

    // Create transactions table
    knex.schema.createTable('transactions', function(table) {
      table.increments('id').primary();
      table.string('stripe_payment_id').unique().notNullable();
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('lawyer_id').unsigned().nullable().references('id').inTable('lawyers').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.decimal('platform_fee', 10, 2).defaultTo(0);
      table.decimal('lawyer_earnings', 10, 2).notNullable();
      table.enum('type', ['consultation', 'hourly', 'document_review', 'retainer', 'subscription']).notNullable();
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
      table.string('description').nullable();
      table.json('metadata').nullable();
      table.timestamps(true, true);
    }),

    // Create earnings table
    knex.schema.createTable('earnings', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().notNullable().references('id').inTable('lawyers').onDelete('CASCADE');
      table.decimal('total_earned', 12, 2).defaultTo(0);
      table.decimal('available_balance', 12, 2).defaultTo(0);
      table.decimal('pending_balance', 12, 2).defaultTo(0);
      table.timestamp('last_payout_date').nullable();
      table.timestamps(true, true);
      table.unique('lawyer_id');
    }),

    // Create subscription_plans table
    knex.schema.createTable('subscription_plans', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('stripe_price_id').notNullable();
      table.decimal('price', 8, 2).notNullable();
      table.enum('billing_period', ['monthly', 'yearly']).defaultTo('monthly');
      table.json('features').nullable();
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('lawyers', function(table) {
      table.dropColumn('stripe_customer_id');
      table.dropColumn('stripe_subscription_id');
      table.dropColumn('subscription_tier');
      table.dropColumn('subscription_status');
      table.dropColumn('consultation_rate');
      table.dropColumn('subscription_created_at');
      table.dropColumn('subscription_expires_at');
    }),
    knex.schema.table('users', function(table) {
      table.dropColumn('stripe_customer_id');
    }),
    knex.schema.dropTable('transactions'),
    knex.schema.dropTable('earnings'),
    knex.schema.dropTable('subscription_plans')
  ]);
};