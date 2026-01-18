exports.up = function(knex) {
  return knex.schema.createTable('user_tasks', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('case_secure_id').references('secure_id').inTable('user_cases').onDelete('CASCADE');
    table.string('assigned_lawyer');
    table.enum('status', ['pending', 'in-progress', 'completed']).defaultTo('pending');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.date('due_date');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_tasks');
};