exports.up = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.renameColumn('filename', 'file_name');
    table.renameColumn('file_path', 'file_url');
    table.string('file_type');
    table.integer('file_size');
    table.enum('category', ['contract', 'evidence', 'correspondence', 'court_filing', 'legal_brief', 'other']).defaultTo('other');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.renameColumn('lawyer_id', 'uploaded_by');
    table.json('tags');
    table.boolean('is_confidential').defaultTo(false);
    table.dropColumn('upload_date');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.renameColumn('file_name', 'filename');
    table.renameColumn('file_url', 'file_path');
    table.dropColumn('file_type');
    table.dropColumn('file_size');
    table.dropColumn('category');
    table.dropColumn('client_id');
    table.renameColumn('uploaded_by', 'lawyer_id');
    table.dropColumn('tags');
    table.dropColumn('is_confidential');
    table.date('upload_date').defaultTo(knex.fn.now());
  });
};