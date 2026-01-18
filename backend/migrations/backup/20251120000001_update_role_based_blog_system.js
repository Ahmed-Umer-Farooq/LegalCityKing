exports.up = async function(knex) {
  // Update users table
  await knex.schema.alterTable('users', function(table) {
    // Update role column to proper ENUM
    table.enu('role', ['user', 'lawyer', 'admin']).defaultTo('user').alter();
  });
  
  // Check if blogs table exists before modifying it
  const blogsTableExists = await knex.schema.hasTable('blogs');
  
  if (blogsTableExists) {
    await knex.schema.alterTable('blogs', function(table) {
      // Update status column to include pending and rejected
      table.enu('status', ['draft', 'pending', 'published', 'rejected']).defaultTo('draft').alter();
    });
    
    // Update existing blogs
    await knex('blogs').update({ author_id: 1, status: 'published' });
  }
  
  // Set user 1 as admin
  return knex('users').where('id', 1).update({ role: 'admin' });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', function(table) {
    table.string('role').defaultTo('user').alter();
  });
  
  const blogsTableExists = await knex.schema.hasTable('blogs');
  
  if (blogsTableExists) {
    await knex.schema.alterTable('blogs', function(table) {
      table.enu('status', ['draft', 'published']).defaultTo('draft').alter();
    });
  }
};