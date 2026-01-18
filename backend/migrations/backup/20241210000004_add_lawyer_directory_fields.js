exports.up = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.text('bio');
    table.integer('experience_years');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.dropColumn('bio');
    table.dropColumn('experience_years');
  });
};