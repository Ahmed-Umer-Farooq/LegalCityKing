exports.up = async function(knex) {
  const hasSubscriptionCancelled = await knex.schema.hasColumn('lawyers', 'subscription_cancelled');
  const hasSubscriptionCancelledAt = await knex.schema.hasColumn('lawyers', 'subscription_cancelled_at');
  const hasSubscriptionExpiresAt = await knex.schema.hasColumn('lawyers', 'subscription_expires_at');
  const hasAutoRenew = await knex.schema.hasColumn('lawyers', 'auto_renew');

  return knex.schema.table('lawyers', function(table) {
    if (!hasSubscriptionCancelled) {
      table.boolean('subscription_cancelled').defaultTo(false);
    }
    if (!hasSubscriptionCancelledAt) {
      table.timestamp('subscription_cancelled_at').nullable();
    }
    if (!hasSubscriptionExpiresAt) {
      table.timestamp('subscription_expires_at').nullable();
    }
    if (!hasAutoRenew) {
      table.boolean('auto_renew').defaultTo(true);
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('subscription_cancelled');
    table.dropColumn('subscription_cancelled_at');
    table.dropColumn('subscription_expires_at');
    table.dropColumn('auto_renew');
  });
};