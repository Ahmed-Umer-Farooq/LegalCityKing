exports.up = function(knex) {
  return knex.schema.createTable('lawyer_restrictions', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().notNullable();
    table.json('restrictions').notNullable();
    table.text('reason').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.unique('lawyer_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lawyer_restrictions');
};
