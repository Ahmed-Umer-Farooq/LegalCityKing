exports.up = function(knex) {
  return knex('platform_reviews').insert([
    {
      lawyer_id: 1,
      client_name: 'Sarah Johnson',
      client_title: 'Business Owner',
      review_text: 'LegalCity connected me with an exceptional attorney who resolved my business dispute efficiently. Professional service from start to finish.',
      rating: 5,
      is_approved: true,
      is_featured: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      lawyer_id: 2,
      client_name: 'Michael Chen',
      client_title: 'Real Estate Investor',
      review_text: 'Outstanding platform with top-quality lawyers. The attorney I found through LegalCity exceeded all expectations in handling my case.',
      rating: 5,
      is_approved: true,
      is_featured: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      lawyer_id: 3,
      client_name: 'Emily Rodriguez',
      client_title: 'Family Law Client',
      review_text: 'Compassionate and skilled attorney found through LegalCity. They guided me through a difficult time with expertise and care.',
      rating: 5,
      is_approved: true,
      is_featured: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};

exports.down = function(knex) {
  return knex('platform_reviews').del();
};