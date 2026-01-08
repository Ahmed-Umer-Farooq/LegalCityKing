exports.up = async function(knex) {
  const hasBillingCycle = await knex.schema.hasColumn('subscription_plans', 'billing_cycle');
  
  if (!hasBillingCycle) {
    return knex.schema.table('subscription_plans', function(table) {
      table.string('billing_cycle').defaultTo('monthly');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('subscription_plans', function(table) {
    table.dropColumn('billing_cycle');
  });
};