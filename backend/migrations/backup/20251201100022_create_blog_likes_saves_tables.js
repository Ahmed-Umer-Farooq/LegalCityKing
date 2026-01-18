exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('blog_likes', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      
      // Ensure one like per user per blog
      table.unique(['blog_id', 'user_id']);
      table.index(['blog_id']);
      table.index(['user_id']);
    }),
    
    knex.schema.createTable('blog_saves', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      
      // Ensure one save per user per blog
      table.unique(['blog_id', 'user_id']);
      table.index(['blog_id']);
      table.index(['user_id']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('blog_saves'),
    knex.schema.dropTable('blog_likes')
  ]);
};