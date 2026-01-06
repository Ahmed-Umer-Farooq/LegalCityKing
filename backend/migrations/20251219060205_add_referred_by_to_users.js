exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'referred_by');
  
  if (!hasColumn) {
    return knex.schema.alterTable('users', (table) => {
      table.string('referred_by', 255).nullable();
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('referred_by');
  });
};