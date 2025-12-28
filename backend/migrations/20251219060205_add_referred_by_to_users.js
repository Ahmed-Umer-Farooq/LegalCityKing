exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('referred_by', 255).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('referred_by');
  });
};