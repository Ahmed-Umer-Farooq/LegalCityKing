exports.up = async function(knex) {
  // First add the columns without constraints
  await knex.schema.alterTable('blogs', function(table) {
    table.string('meta_title', 60);
    table.string('focus_keyword');
    table.string('meta_description', 160);
    table.string('image_alt_text');
    table.string('secure_id', 32);
  });
  
  // Generate unique secure_id for existing blogs
  const blogs = await knex('blogs').select('id').whereNull('secure_id');
  for (const blog of blogs) {
    const crypto = require('crypto');
    const secureId = crypto.randomBytes(16).toString('hex');
    await knex('blogs').where('id', blog.id).update({ secure_id: secureId });
  }
  
  // Now add the unique constraint and index
  await knex.schema.alterTable('blogs', function(table) {
    table.unique('secure_id');
    table.index('secure_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('blogs', function(table) {
    table.dropColumn('meta_title');
    table.dropColumn('focus_keyword');
    table.dropColumn('meta_description');
    table.dropColumn('image_alt_text');
    table.dropColumn('secure_id');
  });
};