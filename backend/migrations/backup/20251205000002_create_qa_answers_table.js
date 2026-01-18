exports.up = function(knex) {
  return knex.schema.createTable('qa_answers', function(table) {
    table.increments('id').primary();
    table.integer('question_id').unsigned().notNullable();
    table.integer('lawyer_id').unsigned().notNullable();
    table.text('answer').notNullable();
    table.boolean('is_best_answer').defaultTo(false);
    table.integer('likes').defaultTo(0);
    table.timestamps(true, true);
    
    table.foreign('question_id').references('id').inTable('qa_questions').onDelete('CASCADE');
    table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
    table.index(['question_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('qa_answers');
};