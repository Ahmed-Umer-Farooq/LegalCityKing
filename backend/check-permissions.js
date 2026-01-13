const mysql = require('mysql2/promise');

async function checkPermissions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'legal_city'
    });

    console.log('Connected to database');

    // Check all permissions
    const [permissions] = await connection.execute("SELECT * FROM permissions");
    console.log('All permissions:', permissions);

    // Check roles
    const [roles] = await connection.execute("SELECT * FROM roles");
    console.log('All roles:', roles);

    // Check role permissions
    const [rolePermissions] = await connection.execute(`
      SELECT r.name as role_name, p.name as permission_name, p.action, p.resource 
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      ORDER BY r.name, p.name
    `);
    console.log('Role permissions:', rolePermissions);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPermissions();