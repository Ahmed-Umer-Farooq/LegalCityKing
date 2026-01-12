exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('users', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('username');
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('role').notNullable().defaultTo('user');
      table.string('google_id').unique();
      table.string('avatar');
      table.string('address');
      table.string('zip_code');
      table.string('city');
      table.string('state');
      table.string('country');
      table.string('mobile_number');
      table.string('email_verification_code');
      table.integer('email_verified').defaultTo(0);
      table.integer('is_verified').defaultTo(0);
      table.integer('is_active').notNullable().defaultTo(1);
      table.integer('profile_completed').defaultTo(1);
      table.string('reset_token');
      table.timestamp('reset_token_expiry');
      table.string('referred_by');
      table.string('secure_id').unique();
      table.timestamps(true, true);
    }),

    knex.schema.createTable('lawyers', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('username');
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('registration_id');
      table.string('law_firm');
      table.string('speciality');
      table.string('google_id').unique();
      table.string('avatar');
      table.string('email_verification_code');
      table.integer('email_verified').defaultTo(0);
      table.integer('profile_completed').defaultTo(1);
      table.string('reset_token');
      table.timestamp('reset_token_expiry');
      table.string('secure_id').unique();
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('lawyers'),
    knex.schema.dropTable('users')
  ]);
};