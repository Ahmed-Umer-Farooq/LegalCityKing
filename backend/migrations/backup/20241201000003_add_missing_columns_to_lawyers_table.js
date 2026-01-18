exports.up = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.string('address');
    table.string('zip_code');
    table.string('city');
    table.string('state');
    table.string('country');
    table.string('mobile_number');
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('address');
    table.dropColumn('zip_code');
    table.dropColumn('city');
    table.dropColumn('state');
    table.dropColumn('country');
    table.dropColumn('mobile_number');
  });
};
