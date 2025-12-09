exports.up = function(knex) {
  return knex.schema
    .createTable('form_categories', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('slug', 100).notNullable().unique();
      table.text('description');
      table.string('icon', 50);
      table.integer('display_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('legal_forms', (table) => {
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
    })
    .createTable('user_forms', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('form_id').unsigned().references('id').inTable('legal_forms').onDelete('CASCADE');
      table.decimal('amount_paid', 10, 2).defaultTo(0);
      table.string('transaction_id', 100);
      table.timestamp('downloaded_at').defaultTo(knex.fn.now());
      table.index(['user_id', 'form_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_forms')
    .dropTableIfExists('legal_forms')
    .dropTableIfExists('form_categories');
};
