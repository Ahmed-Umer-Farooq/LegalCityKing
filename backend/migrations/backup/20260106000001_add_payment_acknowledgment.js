exports.up = async function(knex) {
  const hasAcknowledged = await knex.schema.hasColumn('transactions', 'acknowledged');
  const hasAcknowledgedAt = await knex.schema.hasColumn('transactions', 'acknowledged_at');

  return knex.schema.alterTable('transactions', function(table) {
    if (!hasAcknowledged) {
      table.boolean('acknowledged').defaultTo(false);
    }
    if (!hasAcknowledgedAt) {
      table.timestamp('acknowledged_at').nullable();
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.dropColumn('acknowledged');
    table.dropColumn('acknowledged_at');
  });
};