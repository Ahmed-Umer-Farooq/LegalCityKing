exports.up = async function(knex) {
  // Check if columns exist before adding
  const hasSlug = await knex.schema.hasColumn('legal_forms', 'slug');
  const hasCategoryId = await knex.schema.hasColumn('legal_forms', 'category_id');
  const hasStatus = await knex.schema.hasColumn('legal_forms', 'status');
  
  await knex.schema.alterTable('legal_forms', (table) => {
    if (!hasSlug) table.string('slug', 255).unique();
    if (!hasCategoryId) table.integer('category_id').unsigned();
    table.string('practice_area', 100);
    table.string('file_type', 20).defaultTo('pdf');
    table.boolean('is_free').defaultTo(true);
    table.integer('created_by').unsigned();
    table.enum('created_by_type', ['admin', 'lawyer']).defaultTo('admin');
    table.integer('approved_by').unsigned().nullable();
    if (!hasStatus) table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('approved');
    table.text('rejection_reason').nullable();
    table.decimal('rating', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
  });

  // Update existing records
  await knex('legal_forms').update({
    slug: knex.raw('CONCAT(LOWER(REPLACE(title, " ", "-")), "-", id)'),
    is_free: true,
    created_by: 1,
    created_by_type: 'admin',
    status: 'approved'
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('legal_forms', (table) => {
    table.dropColumn('slug');
    table.dropColumn('category_id');
    table.dropColumn('practice_area');
    table.dropColumn('file_type');
    table.dropColumn('is_free');
    table.dropColumn('created_by');
    table.dropColumn('created_by_type');
    table.dropColumn('approved_by');
    table.dropColumn('status');
    table.dropColumn('rejection_reason');
    table.dropColumn('rating');
    table.dropColumn('rating_count');
  });
};
