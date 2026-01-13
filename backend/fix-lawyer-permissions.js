const db = require('./db');

async function fixLawyerPermissions() {
  console.log('🔧 Fixing RBAC permissions for lawyer roles...\n');

  try {
    // Get lawyer roles
    const lawyerRoles = await db('roles').whereIn('name', ['lawyer', 'verified_lawyer']).select();
    
    if (lawyerRoles.length === 0) {
      console.log('❌ No lawyer roles found');
      return;
    }

    console.log(`✅ Found lawyer roles: ${lawyerRoles.map(r => r.name).join(', ')}`);

    // Required permissions for lawyers
    const requiredPermissions = [
      { action: 'read', resource: 'cases' },
      { action: 'write', resource: 'cases' },
      { action: 'manage', resource: 'cases' },
      { action: 'read', resource: 'tasks' },
      { action: 'write', resource: 'tasks' },
      { action: 'manage', resource: 'tasks' },
      { action: 'read', resource: 'documents' },
      { action: 'write', resource: 'documents' },
      { action: 'read', resource: 'invoices' },
      { action: 'write', resource: 'invoices' },
      { action: 'read', resource: 'payments' },
      { action: 'write', resource: 'payments' },
      { action: 'read', resource: 'appointments' },
      { action: 'write', resource: 'appointments' },
      { action: 'read', resource: 'clients' },
      { action: 'write', resource: 'clients' },
      { action: 'manage', resource: 'profile' }
    ];

    for (const role of lawyerRoles) {
      console.log(`\nProcessing role: ${role.name}`);
      
      for (const perm of requiredPermissions) {
        // Check if permission exists
        let permission = await db('permissions')
          .where({ action: perm.action, resource: perm.resource })
          .first();

        if (!permission) {
          // Create permission
          const [permId] = await db('permissions').insert({
            action: perm.action,
            resource: perm.resource,
            name: `${perm.action}_${perm.resource}`
          });
          permission = { id: permId };
          console.log(`  ✅ Created permission: ${perm.action}:${perm.resource}`);
        }

        // Check if role has this permission
        const roleHasPerm = await db('role_permissions')
          .where({ role_id: role.id, permission_id: permission.id })
          .first();

        if (!roleHasPerm) {
          await db('role_permissions').insert({
            role_id: role.id,
            permission_id: permission.id
          });
          console.log(`  ✅ Assigned ${perm.action}:${perm.resource} to ${role.name}`);
        }
      }
    }

    console.log('\n🎉 Lawyer RBAC permissions fixed!');
    console.log('Lawyers can now create and manage cases, tasks, etc.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixLawyerPermissions();