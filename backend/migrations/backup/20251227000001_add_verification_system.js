exports.up = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.enum('verification_status', ['pending', 'submitted', 'approved', 'rejected']).defaultTo('pending');
    table.text('verification_documents'); // JSON array of uploaded document paths
    table.text('verification_notes'); // Admin notes
    table.datetime('verification_submitted_at');
    table.datetime('verification_approved_at');
    table.integer('verified_by').unsigned().references('id').inTable('users');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('lawyers', function(table) {
    table.dropColumn('verification_status');
    table.dropColumn('verification_documents');
    table.dropColumn('verification_notes');
    table.dropColumn('verification_submitted_at');
    table.dropColumn('verification_approved_at');
    table.dropColumn('verified_by');
  });
};