exports.up = async function(knex) {
  // Create users table
  await knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('username');
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('email_verification_code');
    table.integer('email_verified').defaultTo(0);
    table.string('reset_token');
    table.timestamp('reset_token_expiry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create lawyers table
  await knex.schema.createTable('lawyers', function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('username');
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('registration_id');
    table.string('law_firm');
    table.string('speciality');
    table.string('email_verification_code');
    table.integer('email_verified').defaultTo(0);
    table.string('reset_token');
    table.timestamp('reset_token_expiry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create practice_areas table
  await knex.schema.createTable('practice_areas', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.timestamps(true, true);
  });

  // Create lawyer_practice_areas table
  await knex.schema.createTable('lawyer_practice_areas', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('practice_area_id').unsigned().references('id').inTable('practice_areas').onDelete('CASCADE');
    table.timestamps(true, true);
  });

  // Create lawyer_reviews table
  await knex.schema.createTable('lawyer_reviews', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('review');
    table.timestamps(true, true);
  });

  // Seed practice_areas
  await knex('practice_areas').insert([
    { name: 'Criminal Law', description: 'Defense in criminal cases' },
    { name: 'Civil Law', description: 'Civil disputes and litigation' },
    { name: 'Family Law', description: 'Divorce, custody, and family matters' },
    { name: 'Corporate Law', description: 'Business and corporate legal matters' },
    { name: 'Real Estate Law', description: 'Property and real estate transactions' },
    { name: 'Personal Injury', description: 'Accident and injury claims' },
    { name: 'Immigration Law', description: 'Immigration and visa matters' },
    { name: 'Tax Law', description: 'Tax planning and disputes' }
  ]);

  // Seed sample lawyers
  await knex('lawyers').insert([
    {
      name: 'John Smith',
      username: 'johnsmith',
      email: 'john.smith@lawfirm.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'AB123456',
      law_firm: 'Smith & Associates',
      speciality: 'Criminal Law',
      email_verified: 1
    },
    {
      name: 'Sarah Johnson',
      username: 'sarahjohnson',
      email: 'sarah.johnson@legal.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'CD789012',
      law_firm: 'Johnson Legal Services',
      speciality: 'Family Law',
      email_verified: 1
    },
    {
      name: 'Michael Brown',
      username: 'michaelbrown',
      email: 'michael.brown@brownlaw.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'EF345678',
      law_firm: 'Brown Law Firm',
      speciality: 'Corporate Law',
      email_verified: 1
    },
    {
      name: 'Emily Davis',
      username: 'emilydavis',
      email: 'emily.davis@davislegal.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'GH901234',
      law_firm: 'Davis Legal Group',
      speciality: 'Immigration Law',
      email_verified: 1
    },
    {
      name: 'David Wilson',
      username: 'davidwilson',
      email: 'david.wilson@wilsonlaw.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'IJ567890',
      law_firm: 'Wilson & Partners',
      speciality: 'Real Estate Law',
      email_verified: 1
    },
    {
      name: 'Lisa Anderson',
      username: 'lisaanderson',
      email: 'lisa.anderson@andersonlaw.com',
      password: '$2a$10$hashedpassword', // Replace with actual hashed password
      registration_id: 'KL123456',
      law_firm: 'Anderson Legal',
      speciality: 'Personal Injury',
      email_verified: 1
    }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTable('lawyer_reviews');
  await knex.schema.dropTable('lawyer_practice_areas');
  await knex.schema.dropTable('practice_areas');
  await knex.schema.dropTable('lawyers');
  await knex.schema.dropTable('users');
};
