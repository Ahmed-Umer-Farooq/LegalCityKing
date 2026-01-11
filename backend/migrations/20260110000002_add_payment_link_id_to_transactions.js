exports.up = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.string('payment_link_id', 64).nullable(); // Reference to payment_links.link_id
    table.index(['payment_link_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.dropIndex(['payment_link_id']);
    table.dropColumn('payment_link_id');
  });
};