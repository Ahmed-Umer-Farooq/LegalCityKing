exports.up = function(knex) {
  return knex.schema.alterTable('chat_messages', function(table) {
    table.string('message_type').defaultTo('text'); // 'text' or 'file'
    table.string('file_url').nullable();
    table.string('file_name').nullable();
    table.integer('file_size').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('chat_messages', function(table) {
    table.dropColumn('message_type');
    table.dropColumn('file_url');
    table.dropColumn('file_name');
    table.dropColumn('file_size');
  });
};