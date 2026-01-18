exports.up = function(knex) {
  return knex.schema.table('blogs', function(table) {
    table.string('author_name');
  });
};

exports.down = function(knex) {
  return knex.schema.table('blogs', function(table) {
    table.dropColumn('author_name');
  });
};