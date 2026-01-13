const db = require('./db');

async function fixPaymentLinksTable() {
  try {
    // Drop the unique constraint on transaction_id
    await db.raw('ALTER TABLE payment_links DROP INDEX payment_links_transaction_id_unique');
    console.log('✅ Dropped unique constraint on transaction_id');
  } catch (error) {
    if (error.message.includes("doesn't exist")) {
      console.log('✅ Constraint already removed or does not exist');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  process.exit(0);
}

fixPaymentLinksTable();