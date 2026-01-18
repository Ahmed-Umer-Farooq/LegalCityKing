exports.up = function(knex) {
  return knex.schema.createTable('qa_questions', function(table) {
    table.increments('id').primary();
    table.string('secure_id', 32).unique().notNullable();
    table.text('question').notNullable();
    table.text('situation').notNullable();
    table.string('city_state', 100).notNullable();
    table.enum('plan_hire_attorney', ['yes', 'not_sure', 'no']).notNullable();
    table.integer('user_id').unsigned().nullable();
    table.string('user_email', 255).nullable();
    table.string('user_name', 255).nullable();
    table.enum('status', ['pending', 'answered', 'closed']).defaultTo('pending');
    table.boolean('is_public').defaultTo(true);
    table.integer('views').defaultTo(0);
    table.integer('likes').defaultTo(0);
    table.timestamps(true, true);
    
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.index(['status', 'created_at']);
    table.index(['secure_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('qa_questions');
};