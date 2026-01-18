exports.up = async function(knex) {
  // Add payment fields to lawyers table
  await knex.schema.table('lawyers', function(table) {
    table.string('stripe_customer_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.enum('subscription_tier', ['free', 'professional', 'premium']).defaultTo('free');
    table.enum('subscription_status', ['active', 'canceled', 'past_due', 'trialing']).defaultTo('active');
    table.decimal('consultation_rate', 8, 2).nullable();
    table.timestamp('subscription_created_at').nullable();
    table.timestamp('subscription_expires_at').nullable();
  });

  // Add payment fields to users table
  await knex.schema.table('users', function(table) {
    table.string('stripe_customer_id').nullable();
  });

  // Create transactions table
  await knex.schema.createTable('transactions', function(table) {
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
  });

  // Create earnings table
  await knex.schema.createTable('earnings', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().notNullable().references('id').inTable('lawyers').onDelete('CASCADE');
    table.decimal('total_earned', 12, 2).defaultTo(0);
    table.decimal('available_balance', 12, 2).defaultTo(0);
    table.decimal('pending_balance', 12, 2).defaultTo(0);
    table.timestamp('last_payout_date').nullable();
    table.timestamps(true, true);
    table.unique('lawyer_id');
  });

  // Create subscription_plans table
  await knex.schema.createTable('subscription_plans', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('stripe_price_id').notNullable();
    table.decimal('price', 8, 2).notNullable();
    table.enum('billing_period', ['monthly', 'yearly']).defaultTo('monthly');
    table.json('features').nullable();
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Create payment_links table
  await knex.schema.createTable('payment_links', function(table) {
    table.increments('id').primary();
    table.string('link_id', 64).unique().notNullable();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.string('service_name').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.text('description');
    table.string('client_email');
    table.string('client_name');
    table.timestamp('expires_at').notNullable();
    table.enum('status', ['active', 'disabled', 'expired']).defaultTo('active');
    table.integer('usage_count').defaultTo(0);
    table.integer('max_uses').defaultTo(1);
    table.timestamps(true, true);

    table.index(['link_id']);
    table.index(['lawyer_id']);
    table.index(['status']);
    table.index(['expires_at']);
  });

  // Create user_appointments table
  await knex.schema.createTable('user_appointments', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.enum('appointment_type', ['consultation', 'meeting', 'court', 'review', 'other']).notNullable();
    table.datetime('appointment_date').notNullable();
    table.string('appointment_time').notNullable();
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('lawyer_name');
    table.integer('lawyer_id').unsigned().nullable();
    table.enum('status', ['scheduled', 'completed', 'cancelled', 'postponed']).defaultTo('scheduled');
    table.timestamps(true, true);
  });

  // Create user_cases table
  await knex.schema.createTable('user_cases', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('case_number').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('lawyer_name');
    table.integer('lawyer_id').unsigned().nullable();
    table.enum('status', ['pending', 'active', 'closed']).defaultTo('pending');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.date('next_hearing').nullable();
    table.text('notes');
    table.json('documents');
    table.json('timeline');
    table.timestamps(true, true);
  });

  // Create user_tasks table
  await knex.schema.createTable('user_tasks', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('case_secure_id').references('secure_id').inTable('user_cases').onDelete('CASCADE');
    table.string('assigned_lawyer');
    table.enum('status', ['pending', 'in-progress', 'completed']).defaultTo('pending');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.date('due_date');
    table.timestamps(true, true);
  });

  // Create user_payments table
  await knex.schema.createTable('user_payments', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('payment_method', 50).notNullable();
    table.string('transaction_id', 255).nullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.text('description').nullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id', 'status']);
  });

  // Seed subscription plans
  await knex('subscription_plans').insert([
    {
      name: 'Professional',
      stripe_price_id: 'price_1QdVJL5fbvco9iYvhJGKJGKJ',
      price: 49.00,
      billing_period: 'monthly',
      features: JSON.stringify([
        'Enhanced profile management',
        'Unlimited client messaging',
        'Blog management system',
        'Advanced reports & analytics',
        'Email support'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_1QdVJM5fbvco9iYvhJGKJGKK',
      price: 99.00,
      billing_period: 'monthly',
      features: JSON.stringify([
        'All Professional features',
        'Q&A answer management',
        'Verification badge system',
        'Forms management system',
        'Client management tools',
        'Priority phone support'
      ]),
      active: true
    },
    {
      name: 'Professional',
      stripe_price_id: 'price_1QdVJN5fbvco9iYvhJGKJGKL',
      price: 41.65,
      billing_period: 'yearly',
      features: JSON.stringify([
        'Enhanced profile management',
        'Unlimited client messaging',
        'Blog management system',
        'Advanced reports & analytics',
        'Email support',
        '15% annual discount'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_1QdVJO5fbvco9iYvhJGKJGKM',
      price: 84.15,
      billing_period: 'yearly',
      features: JSON.stringify([
        'All Professional features',
        'Q&A answer management',
        'Verification badge system',
        'Forms management system',
        'Client management tools',
        'Priority phone support',
        '15% annual discount'
      ]),
      active: true
    }
  ]);
};

exports.down = async function(knex) {
  await knex('subscription_plans').del();
  await knex.schema.dropTable('user_payments');
  await knex.schema.dropTable('user_tasks');
  await knex.schema.dropTable('user_cases');
  await knex.schema.dropTable('user_appointments');
  await knex.schema.dropTable('payment_links');
  await knex.schema.dropTable('subscription_plans');
  await knex.schema.dropTable('earnings');
  await knex.schema.dropTable('transactions');

  await knex.schema.table('users', function(table) {
    table.dropColumn('stripe_customer_id');
  });

  await knex.schema.table('lawyers', function(table) {
    table.dropColumn('stripe_customer_id');
    table.dropColumn('stripe_subscription_id');
    table.dropColumn('subscription_tier');
    table.dropColumn('subscription_status');
    table.dropColumn('consultation_rate');
    table.dropColumn('subscription_created_at');
    table.dropColumn('subscription_expires_at');
  });
};
