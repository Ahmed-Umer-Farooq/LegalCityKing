exports.up = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.text('feature_restrictions'); // JSON object of locked features
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.dropColumn('feature_restrictions');
  });
};
