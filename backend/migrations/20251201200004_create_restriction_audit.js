exports.up = function(knex) {
  return knex.schema.createTable('restriction_audit', function(table) {
    table.increments('id').primary();
    table.enum('type', ['plan_restriction', 'lawyer_restriction']).notNullable();
    table.string('target_id').notNullable(); // plan_tier or lawyer_id
    table.json('old_restrictions').nullable();
    table.json('new_restrictions').notNullable();
    table.text('reason').nullable();
    table.integer('changed_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    table.foreign('changed_by').references('id').inTable('users').onDelete('CASCADE');
    table.index(['type', 'target_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('restriction_audit');
};