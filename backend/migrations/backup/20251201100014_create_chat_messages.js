exports.up = function(knex) {
  return knex.schema.createTable('chat_messages', function(table) {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable();
    table.enum('sender_type', ['user', 'lawyer']).notNullable();
    table.integer('receiver_id').unsigned().notNullable();
    table.enum('receiver_type', ['user', 'lawyer']).notNullable();
    table.text('content').notNullable();
    table.boolean('read_status').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['sender_id', 'sender_type']);
    table.index(['receiver_id', 'receiver_type']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chat_messages');
};