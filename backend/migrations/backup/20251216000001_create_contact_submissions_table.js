exports.up = function(knex) {
  return knex.schema.createTable('contact_submissions', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.string('subject').notNullable();
    table.text('message').notNullable();
    table.string('legal_area');
    table.enum('status', ['new', 'in_progress', 'resolved', 'archived']).defaultTo('new');
    table.text('admin_notes');
    table.integer('assigned_to').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.timestamps(true, true);
    table.index(['status', 'created_at']);
    table.index('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contact_submissions');
};
