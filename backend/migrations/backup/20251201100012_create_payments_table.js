exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.increments('id').primary();
    table.string('payment_number').unique().notNullable();
    table.integer('invoice_id').unsigned().references('id').inTable('invoices').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.enum('payment_method', ['cash', 'check', 'credit_card', 'bank_transfer', 'other']).notNullable();
    table.date('payment_date').notNullable();
    table.string('reference_number');
    table.text('notes');
    table.integer('recorded_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};