exports.up = function(knex) {
  return knex.schema.createTable('lawyer_reviews', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('review');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lawyer_reviews');
};