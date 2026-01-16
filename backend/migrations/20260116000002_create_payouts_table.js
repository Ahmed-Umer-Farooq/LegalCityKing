exports.up = function(knex) {
  return knex.schema.createTable('payouts', function(table) {
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
};

exports.down = function(knex) {
  return knex.schema.dropTable('payouts');
};
