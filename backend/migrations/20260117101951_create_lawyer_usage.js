exports.up = function(knex) {
  return knex.schema.createTable('lawyer_usage', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().notNullable();
    table.integer('cases_count').defaultTo(0);
    table.integer('clients_count').defaultTo(0);
    table.integer('documents_count').defaultTo(0);
    table.integer('blogs_count').defaultTo(0);
    table.integer('qa_answers_count').defaultTo(0);
    table.integer('payment_links_count').defaultTo(0);
    table.timestamps(true, true);
    
    table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
    table.unique('lawyer_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lawyer_usage');
};
