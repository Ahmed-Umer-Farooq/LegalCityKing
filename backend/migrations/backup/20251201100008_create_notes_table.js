exports.up = function(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('created_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.boolean('is_private').defaultTo(false);
    table.json('tags');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notes');
};