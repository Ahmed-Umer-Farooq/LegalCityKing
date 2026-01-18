exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('users', function(table) {
      // Check if column doesn't exist before adding
      table.integer('profile_completed').defaultTo(1);
    }),
    knex.schema.table('lawyers', function(table) {
      // Add OAuth columns to lawyers table
      table.string('google_id').unique().nullable();
      table.string('avatar').nullable();
      table.integer('profile_completed').defaultTo(1);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('users', function(table) {
      table.dropColumn('profile_completed');
    }),
    knex.schema.table('lawyers', function(table) {
      table.dropColumn('profile_completed');
      table.dropColumn('google_id');
      table.dropColumn('avatar');
    })
  ]);
};
