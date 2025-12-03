exports.up = function(knex) {
  return knex('subscription_plans').insert([
    {
      name: 'Professional',
      stripe_price_id: 'price_professional_monthly', // Replace with actual Stripe price ID
      price: 49.00,
      billing_period: 'monthly',
      features: JSON.stringify([
        'Enhanced profile with video intro',
        'Unlimited client messages',
        'Priority placement in search results',
        'Analytics dashboard',
        'Email support'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_premium_monthly', // Replace with actual Stripe price ID
      price: 99.00,
      billing_period: 'monthly',
      features: JSON.stringify([
        'All Professional features',
        'Featured homepage placement',
        'Verified badge',
        'Lead generation tools',
        'Client CRM integration',
        'Priority phone support'
      ]),
      active: true
    },
    {
      name: 'Professional',
      stripe_price_id: 'price_professional_yearly', // Replace with actual Stripe price ID
      price: 499.00,
      billing_period: 'yearly',
      features: JSON.stringify([
        'Enhanced profile with video intro',
        'Unlimited client messages',
        'Priority placement in search results',
        'Analytics dashboard',
        'Email support',
        '15% annual discount'
      ]),
      active: true
    },
    {
      name: 'Premium',
      stripe_price_id: 'price_premium_yearly', // Replace with actual Stripe price ID
      price: 999.00,
      billing_period: 'yearly',
      features: JSON.stringify([
        'All Professional features',
        'Featured homepage placement',
        'Verified badge',
        'Lead generation tools',
        'Client CRM integration',
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