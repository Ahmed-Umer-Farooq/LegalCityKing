exports.up = function(knex) {
  return Promise.all([
    // Cases table
    knex.schema.createTableIfNotExists('cases', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
      table.string('title', 255);
      table.string('client_name', 255);
      table.string('type', 100);
      table.enum('status', ['active', 'pending', 'closed']).defaultTo('active');
      table.text('description');
      table.date('created_date').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    }),
    
    // Appointments table
    knex.schema.createTableIfNotExists('appointments', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
      table.string('title', 255);
      table.date('date');
      table.string('type', 50);
      table.string('client_name', 255);
      table.timestamps(true, true);
    }),
    
    // Documents table
    knex.schema.createTableIfNotExists('documents', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
      table.integer('case_id').unsigned().references('id').inTable('cases').nullable();
      table.string('filename', 255);
      table.string('file_path', 500);
      table.date('upload_date').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    }),
    
    // Invoices table
    knex.schema.createTableIfNotExists('invoices', function(table) {
      table.increments('id').primary();
      table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
      table.string('invoice_number', 50);
      table.string('client_name', 255);
      table.decimal('amount', 10, 2);
      table.enum('status', ['paid', 'pending', 'overdue']).defaultTo('pending');
      table.date('created_date').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('invoices'),
    knex.schema.dropTableIfExists('documents'),
    knex.schema.dropTableIfExists('appointments'),
    knex.schema.dropTableIfExists('cases')
  ]);
};