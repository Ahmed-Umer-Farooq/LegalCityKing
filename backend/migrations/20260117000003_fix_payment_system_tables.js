exports.up = async function(knex) {
  // Ensure transactions table has all fields
  const transactionsColumns = [
    { name: 'stripe_payment_id', type: 'string' },
    { name: 'user_id', type: 'integer' },
    { name: 'lawyer_id', type: 'integer' },
    { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
    { name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 },
    { name: 'lawyer_earnings', type: 'decimal', precision: 10, scale: 2 },
    { name: 'type', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'description', type: 'text' },
    { name: 'metadata', type: 'json' },
    { name: 'acknowledged', type: 'boolean', default: false },
    { name: 'acknowledged_at', type: 'timestamp' },
    { name: 'payment_link_id', type: 'string' }
  ];

  for (const col of transactionsColumns) {
    const exists = await knex.schema.hasColumn('transactions', col.name);
    if (!exists) {
      await knex.schema.alterTable('transactions', function(t) {
        let column;
        if (col.type === 'string') {
          column = t.string(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'integer') {
          column = t.integer(col.name).unsigned();
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'decimal') {
          column = t.decimal(col.name, col.precision, col.scale);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'json') {
          column = t.json(col.name);
        } else if (col.type === 'boolean') {
          column = t.boolean(col.name).defaultTo(col.default || false);
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.default) column = column.defaultTo(col.default);
          if (col.notNullable) column = column.notNullable();
        }
      });
    }
  }

  // Ensure earnings table has all fields
  const earningsColumns = [
    { name: 'lawyer_id', type: 'integer', unsigned: true, references: 'lawyers.id' },
    { name: 'total_earned', type: 'decimal', precision: 12, scale: 2, default: 0 },
    { name: 'available_balance', type: 'decimal', precision: 12, scale: 2, default: 0 },
    { name: 'pending_balance', type: 'decimal', precision: 12, scale: 2, default: 0 },
    { name: 'last_payout_date', type: 'timestamp' }
  ];

  for (const col of earningsColumns) {
    const exists = await knex.schema.hasColumn('earnings', col.name);
    if (!exists) {
      await knex.schema.alterTable('earnings', function(t) {
        let column;
        if (col.type === 'integer') {
          column = t.integer(col.name);
          if (col.unsigned) column = column.unsigned();
          if (col.references) column = column.references(col.references.split('.')[1]).inTable(col.references.split('.')[0]).onDelete('CASCADE');
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'decimal') {
          column = t.decimal(col.name, col.precision, col.scale).defaultTo(col.default || 0);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.default) column = column.defaultTo(col.default);
          if (col.notNullable) column = column.notNullable();
        }
      });
    }
  }

  // Ensure subscription_plans has billing_cycle
  const hasBillingCycle = await knex.schema.hasColumn('subscription_plans', 'billing_cycle');
  if (!hasBillingCycle) {
    await knex.schema.alterTable('subscription_plans', function(t) {
      t.string('billing_cycle').defaultTo('monthly');
    });
  }

  // Ensure payment_links has all fields from the latest migration
  const paymentLinksColumns = [
    { name: 'link_id', type: 'string', unique: true, notNullable: true },
    { name: 'lawyer_id', type: 'integer', unsigned: true, references: 'lawyers.id' },
    { name: 'service_name', type: 'string' },
    { name: 'amount', type: 'decimal', precision: 10, scale: 2, notNullable: true },
    { name: 'description', type: 'text' },
    { name: 'client_email', type: 'string' },
    { name: 'client_name', type: 'string' },
    { name: 'expires_at', type: 'timestamp', notNullable: true },
    { name: 'status', type: 'enum', values: ['active', 'disabled', 'expired'], default: 'active' },
    { name: 'usage_count', type: 'integer', default: 0 },
    { name: 'max_uses', type: 'integer', default: 1 }
  ];

  for (const col of paymentLinksColumns) {
    const exists = await knex.schema.hasColumn('payment_links', col.name);
    if (!exists) {
      await knex.schema.alterTable('payment_links', function(t) {
        let column;
        if (col.type === 'string') {
          column = t.string(col.name);
          if (col.unique) column = column.unique();
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'integer') {
          column = t.integer(col.name).defaultTo(col.default || 0);
          if (col.unsigned) column = column.unsigned();
          if (col.references) column = column.references(col.references.split('.')[1]).inTable(col.references.split('.')[0]).onDelete('CASCADE');
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'decimal') {
          column = t.decimal(col.name, col.precision, col.scale);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'enum') {
          column = t.enum(col.name, col.values).defaultTo(col.default);
        }
      });
    }
  }

  // Add indexes if not exist
  // Note: Knex doesn't have hasIndex, so we can try to add and catch error
  try {
    await knex.schema.alterTable('payment_links', function(t) {
      t.index(['link_id']);
      t.index(['lawyer_id']);
      t.index(['status']);
      t.index(['expires_at']);
    });
  } catch (e) {
    // Index might already exist
  }

  try {
    await knex.schema.alterTable('transactions', function(t) {
      t.index(['payment_link_id']);
    });
  } catch (e) {
    // Index might already exist
  }
};

exports.down = function(knex) {
  // No down migration as this is a fix
  return Promise.resolve();
};
