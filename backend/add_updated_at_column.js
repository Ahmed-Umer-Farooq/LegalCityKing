const mysql = require('mysql2/promise');

async function addUpdatedAtColumn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'legal_city'
        });

        // Add updated_at column to users table
        await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        console.log('✅ updated_at column added to users table');

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addUpdatedAtColumn();