exports.up = async function(knex) {
  // Check and add columns to users table
  const usersColumns = await knex.schema.raw('DESCRIBE users');
  const usersColumnNames = usersColumns[0].map(col => col.Field);
  
  await knex.schema.table('users', function(table) {
    if (!usersColumnNames.includes('date_of_birth')) table.date('date_of_birth').nullable();
    if (!usersColumnNames.includes('bio')) table.text('bio').nullable();
    if (!usersColumnNames.includes('profile_image')) table.string('profile_image').nullable();
    if (!usersColumnNames.includes('job_title')) table.string('job_title', 100).nullable();
    if (!usersColumnNames.includes('company')) table.string('company', 100).nullable();
    if (!usersColumnNames.includes('social_links')) table.json('social_links').nullable();
    if (!usersColumnNames.includes('interests')) table.json('interests').nullable();
    if (!usersColumnNames.includes('privacy_settings')) table.json('privacy_settings').nullable();
    if (!usersColumnNames.includes('profile_completion_percentage')) table.integer('profile_completion_percentage').defaultTo(0);
  });
  
  // Check and add columns to lawyers table
  const lawyersColumns = await knex.schema.raw('DESCRIBE lawyers');
  const lawyersColumnNames = lawyersColumns[0].map(col => col.Field);
  
  await knex.schema.table('lawyers', function(table) {
    if (!lawyersColumnNames.includes('date_of_birth')) table.date('date_of_birth').nullable();
    if (!lawyersColumnNames.includes('bio')) table.text('bio').nullable();
    if (!lawyersColumnNames.includes('profile_image')) table.string('profile_image').nullable();
    if (!lawyersColumnNames.includes('social_links')) table.json('social_links').nullable();
    if (!lawyersColumnNames.includes('interests')) table.json('interests').nullable();
    if (!lawyersColumnNames.includes('privacy_settings')) table.json('privacy_settings').nullable();
    if (!lawyersColumnNames.includes('profile_completion_percentage')) table.integer('profile_completion_percentage').defaultTo(0);
  });
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('users', function(table) {
      table.dropColumn('date_of_birth');
      table.dropColumn('bio');
      table.dropColumn('profile_image');
      table.dropColumn('job_title');
      table.dropColumn('company');
      table.dropColumn('social_links');
      table.dropColumn('interests');
      table.dropColumn('privacy_settings');
      table.dropColumn('profile_completion_percentage');
    }),
    
    knex.schema.table('lawyers', function(table) {
      table.dropColumn('date_of_birth');
      table.dropColumn('bio');
      table.dropColumn('profile_image');
      table.dropColumn('social_links');
      table.dropColumn('interests');
      table.dropColumn('privacy_settings');
      table.dropColumn('profile_completion_percentage');
    })
  ]);
};