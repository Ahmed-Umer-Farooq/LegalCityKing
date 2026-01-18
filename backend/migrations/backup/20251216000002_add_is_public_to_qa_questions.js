exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('qa_questions', 'is_public');
  if (!hasColumn) {
    return knex.schema.table('qa_questions', function(table) {
      table.boolean('is_public').defaultTo(true);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('qa_questions', function(table) {
    table.dropColumn('is_public');
  });
};
