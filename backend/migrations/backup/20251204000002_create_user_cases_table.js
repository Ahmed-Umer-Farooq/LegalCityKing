exports.up = function(knex) {
  return knex.schema.createTable('user_cases', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('case_number').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('lawyer_name');
    table.integer('lawyer_id').unsigned().nullable();
    table.enum('status', ['pending', 'active', 'closed']).defaultTo('pending');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.date('next_hearing').nullable();
    table.text('notes');
    table.json('documents');
    table.json('timeline');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_cases');
};