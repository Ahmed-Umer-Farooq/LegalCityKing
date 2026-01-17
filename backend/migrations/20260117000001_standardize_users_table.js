exports.up = async function(knex) {
  const table = 'users';

  // Check and add missing columns
  const columnsToAdd = [
    { name: 'name', type: 'string' },
    { name: 'username', type: 'string' },
    { name: 'email', type: 'string', unique: true, notNullable: true },
    { name: 'password', type: 'string', notNullable: true },
    { name: 'role', type: 'enum', values: ['user', 'lawyer', 'admin', 'client'], default: 'user' },
    { name: 'google_id', type: 'string', unique: true },
    { name: 'avatar', type: 'string' },
    { name: 'is_admin', type: 'boolean', default: false },
    { name: 'last_login', type: 'timestamp' },
    { name: 'profile_completed', type: 'boolean', default: false },
    { name: 'is_verified', type: 'boolean', default: false },
    { name: 'otp_expiry', type: 'timestamp' },
    { name: 'date_of_birth', type: 'date' },
    { name: 'bio', type: 'text' },
    { name: 'profile_image', type: 'string' },
    { name: 'job_title', type: 'string' },
    { name: 'company', type: 'string' },
    { name: 'social_links', type: 'json' },
    { name: 'interests', type: 'json' },
    { name: 'privacy_settings', type: 'json' },
    { name: 'profile_completion_percentage', type: 'integer', default: 0 },
    { name: 'secure_id', type: 'string', unique: true },
    { name: 'stripe_customer_id', type: 'string' },
    { name: 'referred_by', type: 'string' },
    { name: 'created_by_lawyer', type: 'integer' },
    { name: 'address', type: 'string' },
    { name: 'zip_code', type: 'string' },
    { name: 'city', type: 'string' },
    { name: 'state', type: 'string' },
    { name: 'country', type: 'string' },
    { name: 'mobile_number', type: 'string' },
    { name: 'email_verification_code', type: 'string' },
    { name: 'email_verified', type: 'boolean', default: false },
    { name: 'reset_token', type: 'string' },
    { name: 'reset_token_expiry', type: 'timestamp' }
  ];

  for (const col of columnsToAdd) {
    const exists = await knex.schema.hasColumn(table, col.name);
    if (!exists) {
      await knex.schema.alterTable(table, function(t) {
        let column;
        if (col.type === 'string') {
          column = t.string(col.name);
          if (col.unique) column = column.unique();
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'boolean') {
          column = t.boolean(col.name).defaultTo(col.default || false);
        } else if (col.type === 'integer') {
          column = t.integer(col.name).defaultTo(col.default || 0);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.default) column = column.defaultTo(col.default);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'date') {
          column = t.date(col.name);
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'json') {
          column = t.json(col.name);
        } else if (col.type === 'enum') {
          column = t.enum(col.name, col.values).defaultTo(col.default);
        }
      });
    }
  }

  // Add foreign key if not exists
  const hasFK = await knex.schema.hasTable('information_schema.table_constraints') &&
    (await knex.raw(`SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_created_by_lawyer_foreign'`)).length > 0;
  if (!hasFK) {
    await knex.schema.alterTable(table, function(t) {
      t.foreign('created_by_lawyer').references('id').inTable('lawyers').onDelete('SET NULL');
    });
  }
};

exports.down = function(knex) {
  // No down migration as this is a standardization
  return Promise.resolve();
};
