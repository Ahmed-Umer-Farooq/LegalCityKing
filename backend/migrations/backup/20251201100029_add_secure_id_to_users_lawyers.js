exports.up = async function(knex) {
  const crypto = require('crypto');
  
  // Add secure_id to users table
  await knex.schema.alterTable('users', function(table) {
    table.string('secure_id', 32);
  });
  
  // Generate secure_id for existing users
  const users = await knex('users').select('id').whereNull('secure_id');
  for (const user of users) {
    const secureId = crypto.randomBytes(16).toString('hex');
    await knex('users').where('id', user.id).update({ secure_id: secureId });
  }
  
  // Add unique constraint
  await knex.schema.alterTable('users', function(table) {
    table.unique('secure_id');
    table.index('secure_id');
  });
  
  // Add secure_id to lawyers table
  await knex.schema.alterTable('lawyers', function(table) {
    table.string('secure_id', 32);
  });
  
  // Generate secure_id for existing lawyers
  const lawyers = await knex('lawyers').select('id').whereNull('secure_id');
  for (const lawyer of lawyers) {
    const secureId = crypto.randomBytes(16).toString('hex');
    await knex('lawyers').where('id', lawyer.id).update({ secure_id: secureId });
  }
  
  // Add unique constraint
  await knex.schema.alterTable('lawyers', function(table) {
    table.unique('secure_id');
    table.index('secure_id');
  });
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.alterTable('users', function(table) {
      table.dropColumn('secure_id');
    }),
    knex.schema.alterTable('lawyers', function(table) {
      table.dropColumn('secure_id');
    })
  ]);
};
