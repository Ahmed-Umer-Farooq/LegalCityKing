exports.up = function(knex) {
  return knex.raw("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'lawyer', 'admin', 'client') DEFAULT 'user'");
};

exports.down = function(knex) {
  return knex.raw("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'lawyer', 'admin') DEFAULT 'user'");
};