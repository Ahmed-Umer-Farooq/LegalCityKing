exports.up = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.text('education').nullable();
    table.text('experience').nullable();
    table.text('certifications').nullable();
    table.text('languages').nullable();
    table.text('practice_areas').nullable();
    table.text('associations').nullable();
    table.text('publications').nullable();
    table.text('speaking').nullable();
    table.text('office_hours').nullable();
    table.text('payment_options').nullable();
    table.string('years_licensed').nullable();
    table.string('hourly_rate').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('education');
    table.dropColumn('experience');
    table.dropColumn('certifications');
    table.dropColumn('languages');
    table.dropColumn('practice_areas');
    table.dropColumn('associations');
    table.dropColumn('publications');
    table.dropColumn('speaking');
    table.dropColumn('office_hours');
    table.dropColumn('payment_options');
    table.dropColumn('years_licensed');
    table.dropColumn('hourly_rate');
  });
};
