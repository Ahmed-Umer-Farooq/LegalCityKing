exports.up = function(knex) {
  return knex.schema.createTable('call_history', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('user_type').notNullable(); // 'user' or 'lawyer'
    table.integer('partner_id').notNullable();
    table.string('partner_name').notNullable();
    table.string('partner_type').notNullable(); // 'user' or 'lawyer'
    table.integer('duration').notNullable(); // in seconds
    table.string('call_type').defaultTo('voice'); // 'voice' or 'video'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id', 'user_type']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('call_history');
};