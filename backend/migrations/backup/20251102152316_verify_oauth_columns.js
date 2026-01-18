exports.up = function(knex) {
  // This migration verifies that OAuth columns exist in the users table
  return knex.schema.hasColumn('users', 'google_id').then(function(exists) {
    if (!exists) {
      throw new Error('google_id column is missing from users table');
    }
  }).then(function() {
    return knex.schema.hasColumn('users', 'role');
  }).then(function(exists) {
    if (!exists) {
      throw new Error('role column is missing from users table');
    }
  });
};

exports.down = function(knex) {
  // No down migration needed for verification
  return Promise.resolve();
};
