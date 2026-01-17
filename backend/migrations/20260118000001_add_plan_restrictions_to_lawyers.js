exports.up = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.text('plan_restrictions'); // JSON object of plan-based restrictions
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.dropColumn('plan_restrictions');
  });
};