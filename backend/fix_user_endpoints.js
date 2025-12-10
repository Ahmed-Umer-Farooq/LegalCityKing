const db = require('./db');

async function checkUserEndpoints() {
  console.log('🔍 Checking User Endpoints Setup...\n');
  
  try {
    // Check if tables exist
    const tables = ['user_appointments', 'user_cases', 'user_tasks'];
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      console.log(`📋 Table ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (exists) {
        const count = await db(table).count('id as count').first();
        console.log(`   Records: ${count.count}`);
        
        // Show table structure
        const columns = await db(table).columnInfo();
        console.log(`   Columns: ${Object.keys(columns).join(', ')}`);
      }
      console.log('');
    }
    
    // Check if users table has secure_id column
    const userColumns = await db('users').columnInfo();
    const hasSecureId = 'secure_id' in userColumns;
    console.log(`👤 Users table has secure_id: ${hasSecureId ? '✅ YES' : '❌ NO'}`);
    
    if (!hasSecureId) {
      console.log('⚠️  Users table missing secure_id column - this will cause foreign key issues');
    }
    
    console.log('\n📊 Summary:');
    console.log('- Backend server should be running on port 5001');
    console.log('- Frontend should be running on port 3000');
    console.log('- API endpoints are at http://localhost:5001/api/user/...');
    console.log('- Frontend should make requests to backend, not try to serve API routes');
    
  } catch (error) {
    console.error('❌ Error checking endpoints:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUserEndpoints();