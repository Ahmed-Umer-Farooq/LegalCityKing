const mysql = require('mysql2/promise');

async function fixProfilePermissions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'legal_city'
    });

    console.log('Connected to database');

    // Check if profile permissions exist
    const [existingPermissions] = await connection.execute(
      "SELECT * FROM permissions WHERE resource = 'profile'"
    );
    
    if (existingPermissions.length === 0) {
      console.log('Adding profile permissions...');
      
      // Add profile permissions
      await connection.execute(
        "INSERT INTO permissions (name, action, resource, description) VALUES (?, ?, ?, ?)",
        ['read_profile', 'read', 'profile', 'Read profile data']
      );
      
      await connection.execute(
        "INSERT INTO permissions (name, action, resource, description) VALUES (?, ?, ?, ?)",
        ['write_profile', 'write', 'profile', 'Write profile data']
      );
      
      console.log('Profile permissions added');
    } else {
      console.log('Profile permissions already exist');
    }

    // Get permission IDs
    const [readPermissions] = await connection.execute(
      "SELECT id FROM permissions WHERE name = 'read_profile'"
    );
    const [writePermissions] = await connection.execute(
      "SELECT id FROM permissions WHERE name = 'write_profile'"
    );

    if (readPermissions.length === 0 || writePermissions.length === 0) {
      console.log('Profile permissions not found, cannot continue');
      return;
    }

    const readPermissionId = readPermissions[0].id;
    const writePermissionId = writePermissions[0].id;

    // Get all roles
    const [roles] = await connection.execute("SELECT * FROM roles");
    
    for (const role of roles) {
      // Check if role already has profile permissions
      const [existing] = await connection.execute(
        "SELECT * FROM role_permissions WHERE role_id = ? AND permission_id IN (?, ?)",
        [role.id, readPermissionId, writePermissionId]
      );
      
      if (existing.length === 0) {
        console.log(`Adding profile permissions to role: ${role.name}`);
        
        // Add read permission to all roles
        await connection.execute(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [role.id, readPermissionId]
        );
        
        // Add write permission to all roles (users should be able to edit their own profile)
        await connection.execute(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [role.id, writePermissionId]
        );
      }
    }

    console.log('Profile permissions setup complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixProfilePermissions();