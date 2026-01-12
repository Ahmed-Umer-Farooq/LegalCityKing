exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('subscription_plans', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.string('stripe_price_id');
      table.enum('billing_cycle', ['monthly', 'yearly']).defaultTo('monthly');
      table.json('features');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    }),

    knex.schema.createTable('payments', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('stripe_payment_intent_id');
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
      table.string('description');
      table.timestamps(true, true);
    }),

    knex.schema.createTable('user_payments', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('stripe_payment_intent_id');
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      table.string('description');
      table.timestamps(true, true);
    }),

    knex.schema.createTable('payment_links', function(table) {
      table.increments('id').primary();
      table.string('link_id').unique().notNullable();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('description');
      table.enum('status', ['active', 'used', 'expired']).defaultTo('active');
      table.datetime('expires_at');
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('payment_links'),
    knex.schema.dropTable('user_payments'),
    knex.schema.dropTable('payments'),
    knex.schema.dropTable('subscription_plans')
  ]);
};