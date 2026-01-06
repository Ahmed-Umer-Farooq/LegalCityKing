exports.up = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.boolean('acknowledged').defaultTo(false);
    table.timestamp('acknowledged_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.dropColumn('acknowledged');
    table.dropColumn('acknowledged_at');
  });
};