exports.up = function(knex) {
  return knex('feature_restrictions').insert([
    {
      plan_tier: 'free',
      restrictions: JSON.stringify({
        cases: 5, clients: 10, documents: 20, blogs: 3, qa_answers: 5, payment_links: 2,
        messages: false, contacts: false, calendar: false, payment_records: false, 
        tasks: false, payouts: false, reports: false, forms: false, quick_actions: false
      })
    },
    {
      plan_tier: 'professional',
      restrictions: JSON.stringify({
        cases: 50, clients: 100, documents: 500, blogs: 20, qa_answers: 50, payment_links: 20,
        messages: true, contacts: true, calendar: true, payment_records: true, 
        tasks: true, payouts: true, reports: true, forms: false, quick_actions: true
      })
    },
    {
      plan_tier: 'premium',
      restrictions: JSON.stringify({
        cases: -1, clients: -1, documents: -1, blogs: -1, qa_answers: -1, payment_links: -1,
        messages: true, contacts: true, calendar: true, payment_records: true, 
        tasks: true, payouts: true, reports: true, forms: true, quick_actions: true
      })
    }
  ]);
};

exports.down = function(knex) {
  return knex('feature_restrictions').del();
};