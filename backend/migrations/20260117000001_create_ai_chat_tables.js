exports.up = function(knex) {
  return knex.schema
    .createTable('ai_document_sessions', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().notNullable();
      table.string('document_name').notNullable();
      table.text('document_content');
      table.string('document_type', 10); // pdf, docx, txt
      table.text('document_summary');
      table.timestamps(true, true);
      
      table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
      table.index(['lawyer_id', 'created_at']);
    })
    .createTable('ai_chat_messages', function(table) {
      table.increments('id').primary();
      table.integer('session_id').unsigned().notNullable();
      table.integer('lawyer_id').unsigned().notNullable();
      table.enum('role', ['user', 'assistant']).notNullable();
      table.text('message').notNullable();
      table.timestamps(true, true);
      
      table.foreign('session_id').references('id').inTable('ai_document_sessions').onDelete('CASCADE');
      table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
      table.index(['session_id', 'created_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ai_chat_messages')
    .dropTableIfExists('ai_document_sessions');
};