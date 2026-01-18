exports.up = async function(knex) {
  const table = 'lawyers';

  // Check and add missing columns
  const columnsToAdd = [
    { name: 'name', type: 'string' },
    { name: 'username', type: 'string' },
    { name: 'email', type: 'string', unique: true, notNullable: true },
    { name: 'password', type: 'string', notNullable: true },
    { name: 'registration_id', type: 'string' },
    { name: 'law_firm', type: 'string' },
    { name: 'speciality', type: 'string' },
    { name: 'bio', type: 'text' },
    { name: 'experience_years', type: 'integer' },
    { name: 'phone', type: 'string' },
    { name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 },
    { name: 'is_verified', type: 'boolean', default: false },
    { name: 'email_verified', type: 'boolean', default: false },
    { name: 'profile_image', type: 'string' },
    { name: 'date_of_birth', type: 'date' },
    { name: 'social_links', type: 'json' },
    { name: 'interests', type: 'json' },
    { name: 'privacy_settings', type: 'json' },
    { name: 'profile_completion_percentage', type: 'integer', default: 0 },
    { name: 'feature_restrictions', type: 'json' },
    { name: 'google_id', type: 'string', unique: true },
    { name: 'avatar', type: 'string' },
    { name: 'profile_completed', type: 'boolean', default: false },
    { name: 'secure_id', type: 'string', unique: true },
    { name: 'stripe_customer_id', type: 'string' },
    { name: 'stripe_subscription_id', type: 'string' },
    { name: 'subscription_tier', type: 'string' },
    { name: 'subscription_status', type: 'string' },
    { name: 'consultation_rate', type: 'decimal', precision: 10, scale: 2 },
    { name: 'subscription_created_at', type: 'timestamp' },
    { name: 'subscription_expires_at', type: 'timestamp' },
    { name: 'subscription_cancelled', type: 'boolean', default: false },
    { name: 'subscription_cancelled_at', type: 'timestamp' },
    { name: 'auto_renew', type: 'boolean', default: true },
    { name: 'verification_status', type: 'enum', values: ['pending', 'submitted', 'approved', 'rejected'], default: 'pending' },
    { name: 'verification_documents', type: 'text' },
    { name: 'verification_notes', type: 'text' },
    { name: 'verification_submitted_at', type: 'timestamp' },
    { name: 'verification_approved_at', type: 'timestamp' },
    { name: 'verified_by', type: 'integer' },
    { name: 'stripe_connect_account_id', type: 'string' },
    { name: 'connect_onboarding_complete', type: 'boolean', default: false },
    { name: 'payouts_enabled', type: 'boolean', default: false },
    { name: 'payout_schedule', type: 'enum', values: ['daily', 'weekly', 'manual'], default: 'manual' },
    { name: 'minimum_payout_amount', type: 'decimal', precision: 10, scale: 2, default: 50.00 },
    { name: 'last_payout_date', type: 'timestamp' },
    { name: 'address', type: 'string' },
    { name: 'zip_code', type: 'string' },
    { name: 'city', type: 'string' },
    { name: 'state', type: 'string' },
    { name: 'country', type: 'string' },
    { name: 'mobile_number', type: 'string' },
    { name: 'experience', type: 'string' },
    { name: 'description', type: 'text' },
    { name: 'languages', type: 'json' },
    { name: 'lawyer_verified', type: 'boolean', default: false },
    { name: 'rating', type: 'decimal', precision: 3, scale: 1, default: 0.0 },
    { name: 'updated_at', type: 'timestamp', default: knex.fn.now() },
    { name: 'email_verification_code', type: 'string' },
    { name: 'reset_token', type: 'string' },
    { name: 'reset_token_expiry', type: 'timestamp' },
    { name: 'plan_restrictions', type: 'text' }
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
        } else if (col.type === 'decimal') {
          column = t.decimal(col.name, col.precision, col.scale).defaultTo(col.default || 0);
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
    (await knex.raw(`SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lawyers_verified_by_foreign'`)).length > 0;
  if (!hasFK) {
    await knex.schema.alterTable(table, function(t) {
      t.foreign('verified_by').references('id').inTable('users');
    });
  }
};

exports.down = async function(knex) {
  // Rollback is not needed for this migration as it only adds columns
};
