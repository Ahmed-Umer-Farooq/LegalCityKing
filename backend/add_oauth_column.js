const mysql = require('mysql2/promise');

async function addOAuthColumn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'legal_city'
        });

        // Add oauth_provider column to users table
        await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50) DEFAULT NULL
        `);

        console.log('✅ oauth_provider column added to users table');

        // Check current table structure
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM users
        `);

        console.log('\n📋 Current users table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
        });

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addOAuthColumn();