exports.up = function(knex) {
  return knex.schema.alterTable('blog_comments', function(table) {
    // Drop the foreign key constraint to users table
    table.dropForeign(['user_id']);
    // Make user_id just a regular integer without foreign key constraint
    // This allows both users and lawyers to comment using their respective IDs
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('blog_comments', function(table) {
    // Re-add the foreign key constraint if needed to rollback
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};