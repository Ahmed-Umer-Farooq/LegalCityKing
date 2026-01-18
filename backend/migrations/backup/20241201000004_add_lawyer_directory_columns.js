exports.up = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.integer('lawyer_verified').defaultTo(0);
    table.decimal('rating', 3, 1).defaultTo(0.0);
    table.string('phone');
    table.string('experience');
    table.text('description');
    table.string('profile_image', 500);
    table.integer('is_verified').defaultTo(0);
    table.json('languages');
    table.integer('hourly_rate');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('lawyer_verified');
    table.dropColumn('rating');
    table.dropColumn('phone');
    table.dropColumn('experience');
    table.dropColumn('description');
    table.dropColumn('profile_image');
    table.dropColumn('is_verified');
    table.dropColumn('languages');
    table.dropColumn('hourly_rate');
    table.dropColumn('updated_at');
  });
};
