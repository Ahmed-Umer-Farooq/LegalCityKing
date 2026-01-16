exports.up = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.string('stripe_connect_account_id').nullable();
    table.boolean('connect_onboarding_complete').defaultTo(false);
    table.boolean('payouts_enabled').defaultTo(false);
    table.enum('payout_schedule', ['daily', 'weekly', 'manual']).defaultTo('manual');
    table.decimal('minimum_payout_amount', 10, 2).defaultTo(50.00);
    table.timestamp('last_payout_date').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('stripe_connect_account_id');
    table.dropColumn('connect_onboarding_complete');
    table.dropColumn('payouts_enabled');
    table.dropColumn('payout_schedule');
    table.dropColumn('minimum_payout_amount');
    table.dropColumn('last_payout_date');
  });
};
