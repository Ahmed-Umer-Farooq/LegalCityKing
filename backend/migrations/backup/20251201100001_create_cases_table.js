exports.up = function(knex) {
  return knex.schema.alterTable('cases', function(table) {
    table.string('case_number').unique();
    table.date('filing_date');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('estimated_value', 10, 2);
    table.decimal('actual_value', 10, 2);
    table.datetime('next_hearing_date');
    table.dropColumn('client_name');
    table.dropColumn('created_date');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('cases', function(table) {
    table.dropColumn('case_number');
    table.dropColumn('filing_date');
    table.dropColumn('client_id');
    table.dropColumn('estimated_value');
    table.dropColumn('actual_value');
    table.dropColumn('next_hearing_date');
    table.string('client_name', 255);
    table.date('created_date').defaultTo(knex.fn.now());
  });
};