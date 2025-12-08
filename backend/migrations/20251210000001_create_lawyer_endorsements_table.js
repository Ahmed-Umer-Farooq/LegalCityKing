exports.up = function(knex) {
  return knex.schema.createTable('lawyer_endorsements', function(table) {
    table.increments('id').primary();
    table.integer('endorser_lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('endorsed_lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.text('endorsement_text').notNullable();
    table.string('relationship').notNullable();
    table.timestamps(true, true);
    table.unique(['endorser_lawyer_id', 'endorsed_lawyer_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lawyer_endorsements');
};
