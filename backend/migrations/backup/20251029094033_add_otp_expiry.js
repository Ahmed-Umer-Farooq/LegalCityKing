exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.timestamp('otp_expiry').nullable();
  });
};

exports.down = async function(knex) {
  const hasOtpExpiry = await knex.schema.hasColumn('users', 'otp_expiry');
  if (hasOtpExpiry) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('otp_expiry');
    });
  }
};
