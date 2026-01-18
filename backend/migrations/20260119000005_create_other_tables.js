exports.up = async function(knex) {
  // Create qa_questions table
  await knex.schema.createTable('qa_questions', function(table) {
    table.increments('id').primary();
    table.string('secure_id', 32).unique().notNullable();
    table.text('question').notNullable();
    table.text('situation').notNullable();
    table.string('city_state', 100).notNullable();
    table.enum('plan_hire_attorney', ['yes', 'not_sure', 'no']).notNullable();
    table.integer('user_id').unsigned().nullable();
    table.string('user_email', 255).nullable();
    table.string('user_name', 255).nullable();
    table.enum('status', ['pending', 'answered', 'closed']).defaultTo('pending');
    table.boolean('is_public').defaultTo(true);
    table.integer('views').defaultTo(0);
    table.integer('likes').defaultTo(0);
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.index(['status', 'created_at']);
    table.index(['secure_id']);
  });

  // Create qa_answers table
  await knex.schema.createTable('qa_answers', function(table) {
    table.increments('id').primary();
    table.integer('question_id').unsigned().notNullable();
    table.integer('lawyer_id').unsigned().notNullable();
    table.text('answer').notNullable();
    table.boolean('is_best_answer').defaultTo(false);
    table.integer('likes').defaultTo(0);
    table.timestamps(true, true);

    table.foreign('question_id').references('id').inTable('qa_questions').onDelete('CASCADE');
    table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
    table.index(['question_id', 'created_at']);
  });

  // Create lawyer_endorsements table
  await knex.schema.createTable('lawyer_endorsements', function(table) {
    table.increments('id').primary();
    table.integer('endorser_lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('endorsed_lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.text('endorsement_text').notNullable();
    table.string('relationship').notNullable();
    table.timestamps(true, true);
    table.unique(['endorser_lawyer_id', 'endorsed_lawyer_id']);
  });

  // Create form_categories table
  await knex.schema.createTable('form_categories', function(table) {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.text('description');
    table.string('icon', 50);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Create legal_forms table
  await knex.schema.createTable('legal_forms', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description');
    table.integer('category_id').unsigned().references('id').inTable('form_categories').onDelete('SET NULL');
    table.string('practice_area', 100);
    table.string('file_path', 500);
    table.string('file_type', 20).defaultTo('pdf');
    table.decimal('price', 10, 2).defaultTo(0);
    table.boolean('is_free').defaultTo(true);
    table.integer('created_by').unsigned();
    table.enum('created_by_type', ['admin', 'lawyer']).defaultTo('admin');
    table.integer('approved_by').unsigned().nullable();
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.text('rejection_reason').nullable();
    table.integer('downloads_count').defaultTo(0);
    table.decimal('rating', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.timestamps(true, true);
    table.index(['status', 'is_free']);
    table.index(['category_id']);
    table.index(['created_by', 'created_by_type']);
  });

  // Create user_forms table
  await knex.schema.createTable('user_forms', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('form_id').unsigned().references('id').inTable('legal_forms').onDelete('CASCADE');
    table.decimal('amount_paid', 10, 2).defaultTo(0);
    table.string('transaction_id', 100);
    table.timestamp('downloaded_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'form_id']);
  });

  // Create contact_submissions table
  await knex.schema.createTable('contact_submissions', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.string('subject').notNullable();
    table.text('message').notNullable();
    table.string('legal_area');
    table.enum('status', ['new', 'in_progress', 'resolved', 'archived']).defaultTo('new');
    table.text('admin_notes');
    table.integer('assigned_to').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.timestamps(true, true);
    table.index(['status', 'created_at']);
    table.index('email');
  });

  // Create platform_reviews table
  await knex.schema.createTable('platform_reviews', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.string('client_name').notNullable();
    table.string('client_title');
    table.text('review_text').notNullable();
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.boolean('is_approved').defaultTo(false);
    table.boolean('is_featured').defaultTo(false);
    table.timestamps(true, true);
  });

  // Seed form_categories
  await knex('form_categories').insert([
    { name: 'Business Law', slug: 'business-law', description: 'Business contracts and agreements', icon: '💼', display_order: 1 },
    { name: 'Family Law', slug: 'family-law', description: 'Family and domestic legal forms', icon: '👨👩👧', display_order: 2 },
    { name: 'Real Estate', slug: 'real-estate', description: 'Property and rental agreements', icon: '🏠', display_order: 3 },
    { name: 'Estate Planning', slug: 'estate-planning', description: 'Wills, trusts, and estate documents', icon: '📜', display_order: 4 },
    { name: 'Personal Injury', slug: 'personal-injury', description: 'Accident and injury claims', icon: '⚖️', display_order: 5 },
    { name: 'Employment Law', slug: 'employment-law', description: 'Employment contracts and agreements', icon: '💼', display_order: 6 }
  ]);

  // Seed platform_reviews
  await knex('platform_reviews').insert([
    {
      lawyer_id: 1,
      client_name: 'Sarah Johnson',
      client_title: 'Business Owner',
      review_text: 'LegalCity connected me with an exceptional attorney who resolved my business dispute efficiently. Professional service from start to finish.',
      rating: 5,
      is_approved: true,
      is_featured: true
    },
    {
      lawyer_id: 2,
      client_name: 'Michael Chen',
      client_title: 'Real Estate Investor',
      review_text: 'Outstanding platform with top-quality lawyers. The attorney I found through LegalCity exceeded all expectations in handling my case.',
      rating: 5,
      is_approved: true,
      is_featured: true
    },
    {
      lawyer_id: 3,
      client_name: 'Emily Rodriguez',
      client_title: 'Family Law Client',
      review_text: 'Compassionate and skilled attorney found through LegalCity. They guided me through a difficult time with expertise and care.',
      rating: 5,
      is_approved: true,
      is_featured: true
    }
  ]);
};

exports.down = async function(knex) {
  await knex('platform_reviews').del();
  await knex('form_categories').del();
  await knex.schema.dropTable('contact_submissions');
  await knex.schema.dropTable('user_forms');
  await knex.schema.dropTable('legal_forms');
  await knex.schema.dropTable('form_categories');
  await knex.schema.dropTable('lawyer_endorsements');
  await knex.schema.dropTable('qa_answers');
  await knex.schema.dropTable('qa_questions');
};
