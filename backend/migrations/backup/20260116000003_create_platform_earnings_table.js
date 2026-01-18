exports.up = function(knex) {
  return knex.schema.createTable('platform_earnings', function(table) {
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
};

exports.down = function(knex) {
  return knex.schema.dropTable('platform_earnings');
};
