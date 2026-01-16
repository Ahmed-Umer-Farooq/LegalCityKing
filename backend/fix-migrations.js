require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Cleaning migration table...');
    await connection.query('DELETE FROM knex_migrations WHERE name IN (?, ?, ?, ?, ?, ?)', [
      '20251105083853_create_users_table.js',
      '20251201100005_create_invoices_table.js',
      '20251201100006_create_time_entries_table.js',
      '20251201100007_create_expenses_table.js',
      '20251201100011_create_messages_table.js',
      '20251201100013_create_intakes_table.js'
    ]);
    console.log('Migration table cleaned successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixMigrations();
