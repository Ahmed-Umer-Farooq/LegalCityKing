const db = require('./db');

async function addLawyerProfileColumns() {
  try {
    console.log('Adding missing columns to lawyers table...');
    
    const columns = [
      'education TEXT',
      'experience TEXT',
      'certifications TEXT',
      'languages TEXT',
      'practice_areas TEXT',
      'associations TEXT',
      'publications TEXT',
      'speaking TEXT',
      'office_hours TEXT',
      'payment_options TEXT',
      'years_licensed VARCHAR(255)',
      'hourly_rate VARCHAR(255)'
    ];
    
    for (const column of columns) {
      const columnName = column.split(' ')[0];
      try {
        await db.raw(`ALTER TABLE lawyers ADD COLUMN ${column}`);
        console.log(`✓ Added column: ${columnName}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Column ${columnName} already exists`);
        } else {
          console.error(`✗ Error adding ${columnName}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addLawyerProfileColumns();
