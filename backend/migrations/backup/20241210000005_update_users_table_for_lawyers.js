exports.up = function(knex) {
  // No-op: columns already exist from previous migration
  return Promise.resolve();
};

exports.down = function(knex) {
  // No-op: columns managed by previous migration
  return Promise.resolve();
};