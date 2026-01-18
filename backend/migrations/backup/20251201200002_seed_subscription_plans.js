exports.up = function(knex) {
  return knex('subscription_plans').insert([
    {
      name: 'Professional',
      stripe_price_id: 'price_1QdVJL5fbvco9iYvhJGKJGKJ', // Professional monthly
      price: 49.00,
      billing_period: 'monthly',
      billing_cycle: 'monthly',
      features: JSON.stringify([
        'Enhanced profile management',
        'Unlimited client messaging',
        'Blog management system',
        'Advanced reports & analytics',
        'Email support'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_1QdVJM5fbvco9iYvhJGKJGKK', // Premium monthly
      price: 99.00,
      billing_period: 'monthly',
      billing_cycle: 'monthly',
      features: JSON.stringify([
        'All Professional features',
        'Q&A answer management',
        'Verification badge system',
        'Forms management system',
        'Client management tools',
        'Priority phone support'
      ]),
      active: true
    },
    {
      name: 'Professional',
      stripe_price_id: 'price_1QdVJN5fbvco9iYvhJGKJGKL', // Professional yearly
      price: 41.65,
      billing_period: 'yearly',
      billing_cycle: 'yearly',
      features: JSON.stringify([
        'Enhanced profile management',
        'Unlimited client messaging',
        'Blog management system',
        'Advanced reports & analytics',
        'Email support',
        '15% annual discount'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_1QdVJO5fbvco9iYvhJGKJGKM', // Premium yearly
      price: 84.15,
      billing_period: 'yearly',
      billing_cycle: 'yearly',
      features: JSON.stringify([
        'All Professional features',
        'Q&A answer management',
        'Verification badge system',
        'Forms management system',
        'Client management tools',
        'Priority phone support',
        '15% annual discount'
      ]),
      active: true
    }
  ]);
};

exports.down = function(knex) {
  return knex('subscription_plans').del();
};