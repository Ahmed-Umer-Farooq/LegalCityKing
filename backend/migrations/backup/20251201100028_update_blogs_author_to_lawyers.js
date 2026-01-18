exports.up = async function(knex) {
  // Check if foreign key exists before dropping
  const foreignKeys = await knex.raw(`
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'blogs' 
    AND COLUMN_NAME = 'author_id' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  
  if (foreignKeys[0].length > 0) {
    await knex.schema.alterTable('blogs', function(table) {
      table.dropForeign('author_id');
    });
  }
  
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