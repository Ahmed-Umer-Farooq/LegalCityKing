exports.up = async function(knex) {
  // Drop existing foreign key constraint
  await knex.schema.alterTable('blogs', function(table) {
    table.dropForeign('author_id');
  });
  
  // Add new foreign key constraint to lawyers table
  await knex.schema.alterTable('blogs', function(table) {
    table.foreign('author_id').references('id').inTable('lawyers');
  });
};

exports.down = async function(knex) {
  // Drop lawyers foreign key constraint
  await knex.schema.alterTable('blogs', function(table) {
    table.dropForeign('author_id');
  });
  
  // Add back users foreign key constraint
  await knex.schema.alterTable('blogs', function(table) {
    table.foreign('author_id').references('id').inTable('users');
  });
};