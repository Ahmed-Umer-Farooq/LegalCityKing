exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('role').notNullable().defaultTo('user');
    table.string('google_id').unique();
    table.string('avatar');
    table.integer('is_active').notNullable().defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('role');
    table.dropColumn('google_id');
    table.dropColumn('avatar');
    table.dropColumn('is_active');
  });
};
