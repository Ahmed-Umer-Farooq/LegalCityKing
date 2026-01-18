exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('username');
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('email_verification_code');
    table.integer('email_verified').defaultTo(0);
    table.string('reset_token');
    table.timestamp('reset_token_expiry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
