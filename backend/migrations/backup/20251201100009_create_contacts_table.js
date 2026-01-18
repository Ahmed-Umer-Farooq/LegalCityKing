exports.up = function(knex) {
  return knex.schema.createTable('contacts', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.string('company');
    table.string('title');
    table.text('address');
    table.enum('type', ['client', 'opposing_counsel', 'witness', 'expert', 'vendor', 'other']).defaultTo('other');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('SET NULL');
    table.integer('created_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.json('tags');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contacts');
};