exports.up = function(knex) {
  return knex.schema.createTable('feature_restrictions', function(table) {
    table.increments('id').primary();
    table.string('plan_tier').notNullable(); // 'free', 'professional', 'premium'
    table.json('restrictions').notNullable(); // JSON object with all restrictions
    table.timestamps(true, true);
    
    table.unique('plan_tier');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feature_restrictions');
};