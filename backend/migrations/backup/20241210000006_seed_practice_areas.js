exports.up = function(knex) {
  return knex('practice_areas').insert([
    { name: 'Criminal Law', description: 'Defense in criminal cases' },
    { name: 'Civil Law', description: 'Civil disputes and litigation' },
    { name: 'Family Law', description: 'Divorce, custody, and family matters' },
    { name: 'Corporate Law', description: 'Business and corporate legal matters' },
    { name: 'Real Estate Law', description: 'Property and real estate transactions' },
    { name: 'Personal Injury', description: 'Accident and injury claims' },
    { name: 'Immigration Law', description: 'Immigration and visa matters' },
    { name: 'Tax Law', description: 'Tax planning and disputes' }
  ]);
};

exports.down = function(knex) {
  return knex('practice_areas').del();
};