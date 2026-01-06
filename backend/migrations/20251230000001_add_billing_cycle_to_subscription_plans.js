exports.up = function(knex) {
  return knex.schema.table('subscription_plans', function(table) {
    table.string('billing_cycle').defaultTo('monthly');
  });
};

exports.down = function(knex) {
  return knex.schema.table('subscription_plans', function(table) {
    table.dropColumn('billing_cycle');
  });
};