exports.up = function(knex) {
  return knex.schema.createTable('calls', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.datetime('call_date').notNullable();
    table.integer('duration_minutes');
    table.enum('call_type', ['incoming', 'outgoing']).notNullable();
    table.enum('status', ['completed', 'missed', 'scheduled']).defaultTo('completed');
    table.integer('contact_id').unsigned().references('id').inTable('contacts').onDelete('CASCADE');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.text('notes');
    table.boolean('is_billable').defaultTo(false);
    table.decimal('billable_rate', 8, 2);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('calls');
};