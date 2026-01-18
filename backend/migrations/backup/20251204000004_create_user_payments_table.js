exports.up = function(knex) {
  return knex.schema.createTable('user_payments', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('payment_method', 50).notNullable();
    table.string('transaction_id', 255).nullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.text('description').nullable();
    table.timestamps(true, true);
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_payments');
};