exports.up = async function(knex) {
  // Blogs table
  await knex.schema.createTable('blogs', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('slug').unique().notNullable();
    table.text('excerpt');
    table.text('content');
    table.string('featured_image');
    table.string('category');
    table.json('tags');
    table.integer('views_count').defaultTo(0);
    table.integer('author_id').unsigned().references('id').inTable('lawyers');
    table.enum('status', ['draft', 'published']).defaultTo('draft');
    table.timestamp('published_at');
    table.timestamps(true, true);
  });

  // Blog comments table
  await knex.schema.createTable('blog_comments', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('comment_text').notNullable();
    table.integer('parent_comment_id').unsigned().nullable().references('id').inTable('blog_comments').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['blog_id']);
    table.index(['user_id']);
    table.index(['parent_comment_id']);
  });

  // Blog likes table
  await knex.schema.createTable('blog_likes', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['blog_id', 'user_id']);
    table.index(['blog_id']);
    table.index(['user_id']);
  });

  // Blog saves table
  await knex.schema.createTable('blog_saves', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['blog_id', 'user_id']);
    table.index(['blog_id']);
    table.index(['user_id']);
  });

  // Blog reports table
  await knex.schema.createTable('blog_reports', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable();
    table.integer('user_id').unsigned().nullable();
    table.string('reporter_email').nullable();
    table.string('reason').notNullable();
    table.text('description').nullable();
    table.enum('status', ['pending', 'reviewed', 'resolved', 'dismissed']).defaultTo('pending');
    table.integer('reviewed_by').unsigned().nullable();
    table.text('admin_notes').nullable();
    table.timestamps(true, true);

    table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('reviewed_by').references('id').inTable('users').onDelete('SET NULL');

    table.index(['blog_id']);
    table.index(['status']);
    table.index(['reason']);
  });

  // Call history table
  await knex.schema.createTable('call_history', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('user_type').notNullable();
    table.integer('partner_id').notNullable();
    table.string('partner_name').notNullable();
    table.string('partner_type').notNullable();
    table.integer('duration').notNullable();
    table.string('call_type').defaultTo('voice');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'user_type']);
    table.index('created_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('call_history');
  await knex.schema.dropTable('blog_reports');
  await knex.schema.dropTable('blog_saves');
  await knex.schema.dropTable('blog_likes');
  await knex.schema.dropTable('blog_comments');
  await knex.schema.dropTable('blogs');
};
