exports.up = async function(knex) {
  // Cases table
  await knex.schema.createTable('cases', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
    table.string('title', 255);
    table.string('client_name', 255);
    table.string('type', 100);
    table.enum('status', ['active', 'pending', 'closed']).defaultTo('active');
    table.text('description');
    table.date('created_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  // Appointments table
  await knex.schema.createTable('appointments', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
    table.string('title', 255);
    table.date('date');
    table.string('type', 50);
    table.string('client_name', 255);
    table.timestamps(true, true);
  });

  // Documents table
  await knex.schema.createTable('documents', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
    table.integer('case_id').unsigned().references('id').inTable('cases').nullable();
    table.string('filename', 255);
    table.string('file_path', 500);
    table.date('upload_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  // Invoices table
  await knex.schema.createTable('invoices', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
    table.string('invoice_number', 50);
    table.string('client_name', 255);
    table.decimal('amount', 10, 2);
    table.enum('status', ['paid', 'pending', 'overdue']).defaultTo('pending');
    table.date('created_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  // Events table
  await knex.schema.createTable('events', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.enum('event_type', ['hearing', 'meeting', 'deadline', 'consultation', 'court_date', 'other']).notNullable();
    table.datetime('start_date_time').notNullable();
    table.datetime('end_date_time');
    table.string('location');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.json('attendees');
    table.boolean('reminder_sent').defaultTo(false);
    table.enum('status', ['scheduled', 'completed', 'cancelled', 'postponed']).defaultTo('scheduled');
    table.timestamps(true, true);
  });

  // Tasks table
  await knex.schema.createTable('tasks', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
    table.datetime('due_date');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('assigned_to').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.integer('created_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.datetime('completed_at');
    table.timestamps(true, true);
  });

  // Notes table
  await knex.schema.createTable('notes', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('created_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.boolean('is_private').defaultTo(false);
    table.json('tags');
    table.timestamps(true, true);
  });

  // Contacts table
  await knex.schema.createTable('contacts', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.string('company');
    table.string('title');
    table.text('address');
    table.enum('type', ['client', 'opposing_counsel', 'witness', 'expert', 'vendor', 'other']).defaultTo('other');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('SET NULL');
    table.integer('created_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.json('tags');
    table.timestamps(true, true);
  });

  // Calls table
  await knex.schema.createTable('calls', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.datetime('call_date').notNullable();
    table.integer('duration_minutes');
    table.enum('call_type', ['incoming', 'outgoing']).notNullable();
    table.enum('status', ['completed', 'missed', 'scheduled']).defaultTo('completed');
    table.integer('contact_id').unsigned().references('id').inTable('contacts').onDelete('CASCADE');
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.text('notes');
    table.boolean('is_billable').defaultTo(false);
    table.decimal('billable_rate', 8, 2);
    table.timestamps(true, true);
  });

  // Payments table
  await knex.schema.createTable('payments', function(table) {
    table.increments('id').primary();
    table.string('payment_number').unique().notNullable();
    table.integer('invoice_id').unsigned().references('id').inTable('invoices').onDelete('CASCADE');
    table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.enum('payment_method', ['cash', 'check', 'credit_card', 'bank_transfer', 'other']).notNullable();
    table.date('payment_date').notNullable();
    table.string('reference_number');
    table.text('notes');
    table.integer('recorded_by').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.timestamps(true, true);
  });

  // Chat messages table
  await knex.schema.createTable('chat_messages', function(table) {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable();
    table.enum('sender_type', ['user', 'lawyer']).notNullable();
    table.integer('receiver_id').unsigned().notNullable();
    table.enum('receiver_type', ['user', 'lawyer']).notNullable();
    table.text('content').notNullable();
    table.boolean('read_status').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['sender_id', 'sender_type']);
    table.index(['receiver_id', 'receiver_type']);
    table.index('created_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('chat_messages');
  await knex.schema.dropTable('payments');
  await knex.schema.dropTable('calls');
  await knex.schema.dropTable('contacts');
  await knex.schema.dropTable('notes');
  await knex.schema.dropTable('tasks');
  await knex.schema.dropTable('events');
  await knex.schema.dropTable('invoices');
  await knex.schema.dropTable('documents');
  await knex.schema.dropTable('appointments');
  await knex.schema.dropTable('cases');
};
