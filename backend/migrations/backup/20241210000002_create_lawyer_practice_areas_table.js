exports.up = function(knex) {
  return knex.schema.createTable('lawyer_practice_areas', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('practice_area_id').unsigned().references('id').inTable('practice_areas').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lawyer_practice_areas');
};