const db = require('./db');

async function fixAllLawyerPermissions() {
  console.log('🔧 Fixing ALL lawyer dashboard permissions...\n');

  try {
    // Get all lawyer roles
    const lawyerRoles = await db('roles').whereIn('name', ['lawyer', 'verified_lawyer']).select();
    
    if (lawyerRoles.length === 0) {
      console.log('❌ No lawyer roles found');
      return;
    }

    console.log(`✅ Found lawyer roles: ${lawyerRoles.map(r => r.name).join(', ')}`);

    // Complete set of lawyer permissions for ALL dashboard features
    const allLawyerPermissions = [
      // Core permissions
      { action: 'read', resource: 'cases' },
      { action: 'write', resource: 'cases' },
      { action: 'manage', resource: 'cases' },
      { action: 'delete', resource: 'cases' },
      
      // Tasks
      { action: 'read', resource: 'tasks' },
      { action: 'write', resource: 'tasks' },
      { action: 'manage', resource: 'tasks' },
      { action: 'delete', resource: 'tasks' },
      
      // Documents
      { action: 'read', resource: 'documents' },
      { action: 'write', resource: 'documents' },
      { action: 'manage', resource: 'documents' },
      { action: 'delete', resource: 'documents' },
      
      // Invoices & Billing
      { action: 'read', resource: 'invoices' },
      { action: 'write', resource: 'invoices' },
      { action: 'manage', resource: 'invoices' },
      { action: 'delete', resource: 'invoices' },
      
      // Payments & Records
      { action: 'read', resource: 'payments' },
      { action: 'write', resource: 'payments' },
      { action: 'manage', resource: 'payments' },
      { action: 'read', resource: 'payment-records' },
      { action: 'write', resource: 'payment-records' },
      
      // Time Entries
      { action: 'read', resource: 'time-entries' },
      { action: 'write', resource: 'time-entries' },
      { action: 'manage', resource: 'time-entries' },
      { action: 'delete', resource: 'time-entries' },
      
      // Expenses
      { action: 'read', resource: 'expenses' },
      { action: 'write', resource: 'expenses' },
      { action: 'manage', resource: 'expenses' },
      { action: 'delete', resource: 'expenses' },
      
      // Appointments & Calendar
      { action: 'read', resource: 'appointments' },
      { action: 'write', resource: 'appointments' },
      { action: 'manage', resource: 'appointments' },
      { action: 'delete', resource: 'appointments' },
      { action: 'read', resource: 'calendar' },
      { action: 'write', resource: 'calendar' },
      
      // Clients & Contacts
      { action: 'read', resource: 'clients' },
      { action: 'write', resource: 'clients' },
      { action: 'manage', resource: 'clients' },
      { action: 'delete', resource: 'clients' },
      { action: 'read', resource: 'contacts' },
      { action: 'write', resource: 'contacts' },
      
      // Events
      { action: 'read', resource: 'events' },
      { action: 'write', resource: 'events' },
      { action: 'manage', resource: 'events' },
      { action: 'delete', resource: 'events' },
      
      // Notes
      { action: 'read', resource: 'notes' },
      { action: 'write', resource: 'notes' },
      { action: 'manage', resource: 'notes' },
      { action: 'delete', resource: 'notes' },
      
      // Messages & Communication
      { action: 'read', resource: 'messages' },
      { action: 'write', resource: 'messages' },
      { action: 'manage', resource: 'messages' },
      
      // Calls
      { action: 'read', resource: 'calls' },
      { action: 'write', resource: 'calls' },
      { action: 'manage', resource: 'calls' },
      
      // Intakes
      { action: 'read', resource: 'intakes' },
      { action: 'write', resource: 'intakes' },
      { action: 'manage', resource: 'intakes' },
      
      // Profile & Settings
      { action: 'read', resource: 'profile' },
      { action: 'write', resource: 'profile' },
      { action: 'manage', resource: 'profile' },
      
      // Dashboard & Stats
      { action: 'read', resource: 'dashboard' },
      { action: 'read', resource: 'stats' },
      
      // Blogs (for lawyer content creation)
      { action: 'read', resource: 'blogs' },
      { action: 'write', resource: 'blogs' },
      { action: 'manage', resource: 'blogs' }
    ];

    for (const role of lawyerRoles) {
      console.log(`\nProcessing role: ${role.name}`);
      let permissionsAdded = 0;
      
      for (const perm of allLawyerPermissions) {
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
          permissionsAdded++;
        }
      }
      
      console.log(`  ✅ Added ${permissionsAdded} permissions to ${role.name}`);
    }

    console.log('\n🎉 ALL lawyer dashboard permissions fixed!');
    console.log('Lawyers can now access:');
    console.log('- Cases (create, read, update, delete)');
    console.log('- Tasks (full management)');
    console.log('- Documents (full management)');
    console.log('- Invoices & Billing (full access)');
    console.log('- Payment Records (full access)');
    console.log('- Time Entries (full management)');
    console.log('- Expenses (full management)');
    console.log('- Appointments & Calendar (full access)');
    console.log('- Clients & Contacts (full management)');
    console.log('- Events (full management)');
    console.log('- Notes (full management)');
    console.log('- Messages & Calls (full access)');
    console.log('- Profile & Settings (full access)');
    console.log('- Dashboard & Stats (read access)');
    console.log('- All Quick Actions (enabled)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixAllLawyerPermissions();