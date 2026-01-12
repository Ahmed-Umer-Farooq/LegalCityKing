exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('cases', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('case_number').unique();
      table.enum('status', ['active', 'closed', 'pending', 'on_hold']).defaultTo('pending');
      table.date('filing_date');
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
      table.integer('client_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('estimated_value', 10, 2);
      table.decimal('actual_value', 10, 2);
      table.datetime('next_hearing_date');
      table.timestamps(true, true);
    }),

    knex.schema.createTable('tasks', function(table) {
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
    }),

    knex.schema.createTable('user_tasks', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
      table.datetime('due_date');
      table.enum('status', ['pending', 'completed']).defaultTo('pending');
      table.timestamps(true, true);
    }),

    knex.schema.createTable('events', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.datetime('start_time').notNullable();
      table.datetime('end_time').notNullable();
      table.string('location');
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
      table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('SET NULL');
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('events'),
    knex.schema.dropTable('user_tasks'),
    knex.schema.dropTable('tasks'),
    knex.schema.dropTable('cases')
  ]);
};