exports.up = function(knex) {
  return knex.schema.createTable('blogs', function(table) {
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
};

exports.down = function(knex) {
  return knex.schema.dropTable('blogs');
};