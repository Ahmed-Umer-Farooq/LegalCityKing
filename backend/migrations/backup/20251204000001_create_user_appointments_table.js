exports.up = function(knex) {
  return knex.schema.createTable('user_appointments', function(table) {
    table.increments('id').primary();
    table.string('secure_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.enum('appointment_type', ['consultation', 'meeting', 'court', 'review', 'other']).notNullable();
    table.datetime('appointment_date').notNullable();
    table.string('appointment_time').notNullable();
    table.string('user_secure_id').references('secure_id').inTable('users').onDelete('CASCADE');
    table.string('lawyer_name');
    table.integer('lawyer_id').unsigned().nullable();
    table.enum('status', ['scheduled', 'completed', 'cancelled', 'postponed']).defaultTo('scheduled');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_appointments');
};