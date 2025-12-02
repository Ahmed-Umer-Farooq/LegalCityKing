exports.up = function(knex) {
  return knex('lawyers')
    .update({
      subscription_tier: knex.raw("CASE WHEN MOD(id, 3) = 0 THEN 'premium' WHEN MOD(id, 3) = 1 THEN 'professional' ELSE 'free' END"),
      subscription_status: 'active',
      subscription_created_at: knex.fn.now()
    });
};

exports.down = function(knex) {
  return knex('lawyers')
    .update({
      subscription_tier: 'free',
      subscription_status: 'active',
      subscription_created_at: null
    });
};