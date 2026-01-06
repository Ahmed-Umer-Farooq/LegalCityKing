require('dotenv').config();
const db = require('./db');

const addAcknowledgmentFields = async () => {
  try {
    await db.schema.alterTable('transactions', function(table) {
      table.boolean('acknowledged').defaultTo(false);
      table.timestamp('acknowledged_at').nullable();
    });
    console.log('✅ Added acknowledgment fields to transactions table');
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('✅ Acknowledgment fields already exist');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
};

addAcknowledgmentFields();