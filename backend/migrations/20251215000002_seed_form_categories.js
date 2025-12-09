exports.up = async function(knex) {
  await knex('form_categories').insert([
    { name: 'Business Law', slug: 'business-law', description: 'Business contracts and agreements', icon: '💼', display_order: 1 },
    { name: 'Family Law', slug: 'family-law', description: 'Family and domestic legal forms', icon: '👨‍👩‍👧', display_order: 2 },
    { name: 'Real Estate', slug: 'real-estate', description: 'Property and rental agreements', icon: '🏠', display_order: 3 },
    { name: 'Estate Planning', slug: 'estate-planning', description: 'Wills, trusts, and estate documents', icon: '📜', display_order: 4 },
    { name: 'Personal Injury', slug: 'personal-injury', description: 'Accident and injury claims', icon: '⚖️', display_order: 5 },
    { name: 'Employment Law', slug: 'employment-law', description: 'Employment contracts and agreements', icon: '💼', display_order: 6 }
  ]);
};

exports.down = function(knex) {
  return knex('form_categories').del();
};
