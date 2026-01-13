exports.up = function(knex) {
  return knex.schema.alterTable('payment_links', function(table) {
    // Drop the unique constraint on transaction_id if it exists
    table.dropUnique(['transaction_id']);
  }).catch(() => {
    // If the constraint doesn't exist, that's fine
    console.log('transaction_id unique constraint does not exist, skipping...');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payment_links', function(table) {
    // Re-add the unique constraint if needed
    table.unique(['transaction_id']);
  });
};