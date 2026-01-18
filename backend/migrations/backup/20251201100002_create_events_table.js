exports.up = function(knex) {
  return knex.schema.createTable('events', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.enum('event_type', ['hearing', 'meeting', 'deadline', 'consultation', 'court_date', 'other']).notNullable();
    table.datetime('start_date_time').notNullable();
    table.datetime('end_date_time');
    table.string('location');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.json('attendees');
    table.boolean('reminder_sent').defaultTo(false);
    table.enum('status', ['scheduled', 'completed', 'cancelled', 'postponed']).defaultTo('scheduled');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('events');
};