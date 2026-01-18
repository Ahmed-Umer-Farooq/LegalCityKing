exports.up = function(knex) {
  return knex.schema.createTable('blog_comments', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('comment_text').notNullable();
    table.integer('parent_comment_id').unsigned().nullable().references('id').inTable('blog_comments').onDelete('CASCADE');
    table.timestamps(true, true);
    
    // Add indexes for better performance
    table.index(['blog_id']);
    table.index(['user_id']);
    table.index(['parent_comment_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blog_comments');
};