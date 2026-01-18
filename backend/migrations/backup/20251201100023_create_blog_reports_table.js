exports.up = function(knex) {
  return knex.schema.createTable('blog_reports', function(table) {
    table.increments('id').primary();
    table.integer('blog_id').unsigned().notNullable();
    table.integer('user_id').unsigned().nullable(); // null for anonymous reports
    table.string('reporter_email').nullable(); // for anonymous reports
    table.string('reason').notNullable(); // 'vulgar', 'spam', 'inappropriate', 'copyright'
    table.text('description').nullable();
    table.enum('status', ['pending', 'reviewed', 'resolved', 'dismissed']).defaultTo('pending');
    table.integer('reviewed_by').unsigned().nullable(); // admin who reviewed
    table.text('admin_notes').nullable();
    table.timestamps(true, true);
    
    table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.index(['blog_id']);
    table.index(['status']);
    table.index(['reason']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blog_reports');
};