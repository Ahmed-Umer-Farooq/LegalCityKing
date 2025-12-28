const db = require('./db');

async function checkTableStructure() {
  try {
    console.log('Checking table structures...');
    
    // Check cases table structure
    const casesColumns = await db.raw("DESCRIBE cases");
    console.log('\nCases table structure:');
    console.log(casesColumns[0]);
    
    // Check invoices table structure
    const invoicesColumns = await db.raw("DESCRIBE invoices");
    console.log('\nInvoices table structure:');
    console.log(invoicesColumns[0]);
    
    // Check events table structure
    const eventsColumns = await db.raw("DESCRIBE events");
    console.log('\nEvents table structure:');
    console.log(eventsColumns[0]);
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();