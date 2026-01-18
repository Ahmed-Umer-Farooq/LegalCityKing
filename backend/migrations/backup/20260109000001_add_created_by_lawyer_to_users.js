exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.integer('created_by_lawyer').unsigned().nullable();
    table.foreign('created_by_lawyer').references('id').inTable('lawyers').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropForeign('created_by_lawyer');
    table.dropColumn('created_by_lawyer');
  });
};