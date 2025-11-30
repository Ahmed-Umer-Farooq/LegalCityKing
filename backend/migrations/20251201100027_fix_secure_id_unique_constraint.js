exports.up = async function(knex) {
  // Generate unique secure_id for existing blogs that don't have one or have duplicates
  const crypto = require('crypto');
  
  // Get all blogs
  const blogs = await knex('blogs').select('id', 'secure_id');
  
  // Track used secure_ids to avoid duplicates
  const usedIds = new Set();
  
  for (const blog of blogs) {
    let secureId = blog.secure_id;
    
    // If secure_id is null, empty, or already used, generate a new one
    if (!secureId || usedIds.has(secureId)) {
      do {
        secureId = crypto.randomBytes(16).toString('hex');
      } while (usedIds.has(secureId));
      
      await knex('blogs').where('id', blog.id).update({ secure_id: secureId });
    }
    
    usedIds.add(secureId);
  }
  
  // Now add the unique constraint
  await knex.schema.alterTable('blogs', function(table) {
    table.unique('secure_id');
    table.index('secure_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('blogs', function(table) {
    table.dropUnique('secure_id');
    table.dropIndex('secure_id');
  });
};