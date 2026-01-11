exports.up = function(knex) {
  return knex.schema.createTable('payment_links', function(table) {
    table.increments('id').primary();
    table.string('link_id', 64).unique().notNullable(); // Secure random ID for the URL
    table.integer('lawyer_id').unsigned().references('id').inTable('lawyers').onDelete('CASCADE');
    table.string('service_name').notNullable(); // e.g., "30-min Consultation", "Document Review"
    table.decimal('amount', 10, 2).notNullable();
    table.text('description'); // Optional description
    table.string('client_email'); // Optional - if link is for specific client
    table.string('client_name'); // Optional - if link is for specific client
    table.timestamp('expires_at').notNullable(); // When the link expires
    table.enum('status', ['active', 'disabled', 'expired']).defaultTo('active');
    table.integer('usage_count').defaultTo(0); // How many times it's been used
    table.integer('max_uses').defaultTo(1); // Maximum number of uses (default 1)
    table.timestamps(true, true);
    
    table.index(['link_id']);
    table.index(['lawyer_id']);
    table.index(['status']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_links');
};