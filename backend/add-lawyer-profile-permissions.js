const mysql = require('mysql2/promise');

async function addLawyerProfilePermissions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'legal_city'
    });

    console.log('Connected to database');

    // Get the profile permission ID
    const [profilePermissions] = await connection.execute(
      "SELECT id FROM permissions WHERE resource = 'profile' AND action = 'manage'"
    );
    
    if (profilePermissions.length === 0) {
      console.log('Profile permission not found');
      return;
    }
    
    const profilePermissionId = profilePermissions[0].id;
    console.log('Profile permission ID:', profilePermissionId);

    // Get lawyer and verified_lawyer role IDs
    const [lawyerRoles] = await connection.execute(
      "SELECT id, name FROM roles WHERE name IN ('lawyer', 'verified_lawyer')"
    );
    
    for (const role of lawyerRoles) {
      // Check if role already has profile permission
      const [existing] = await connection.execute(
        "SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?",
        [role.id, profilePermissionId]
      );
      
      if (existing.length === 0) {
        console.log(`Adding profile permission to role: ${role.name}`);
        
        await connection.execute(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [role.id, profilePermissionId]
        );
      } else {
        console.log(`Role ${role.name} already has profile permission`);
      }
    }

    console.log('Lawyer profile permissions setup complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addLawyerProfilePermissions();