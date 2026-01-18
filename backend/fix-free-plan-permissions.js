const db = require('./db');

async function fixFreePlanPermissions() {
  try {
    console.log('🔧 Fixing free plan lawyer permissions...');

    // Get the lawyer role ID
    const lawyerRole = await db('roles').where('name', 'lawyer').first();
    if (!lawyerRole) {
      console.error('❌ Lawyer role not found');
      return;
    }

    console.log(`✅ Found lawyer role with ID: ${lawyerRole.id}`);

    // Check current permissions for lawyer role
    const currentPermissions = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', lawyerRole.id)
      .select('permissions.name', 'permissions.resource', 'permissions.action');

    console.log('📋 Current lawyer permissions:');
    currentPermissions.forEach(p => {
      console.log(`   - ${p.name} (${p.action}:${p.resource})`);
    });

    // Add missing permissions for basic functionality
    const requiredPermissions = [
      { name: 'lawyer.notes.read', resource: 'notes', action: 'read', description: 'View own notes' },
      { name: 'lawyer.notes.write', resource: 'notes', action: 'write', description: 'Manage own notes' },
      { name: 'lawyer.events.read', resource: 'events', action: 'read', description: 'View own events' },
      { name: 'lawyer.events.write', resource: 'events', action: 'write', description: 'Manage own events' },
      { name: 'lawyer.tasks.read', resource: 'tasks', action: 'read', description: 'View own tasks' },
      { name: 'lawyer.tasks.write', resource: 'tasks', action: 'write', description: 'Manage own tasks' },
      { name: 'lawyer.contacts.read', resource: 'contacts', action: 'read', description: 'View own contacts' },
      { name: 'lawyer.contacts.write', resource: 'contacts', action: 'write', description: 'Manage own contacts' },
      { name: 'lawyer.calls.read', resource: 'calls', action: 'read', description: 'View own calls' },
      { name: 'lawyer.calls.write', resource: 'calls', action: 'write', description: 'Manage own calls' }
    ];

    console.log('\n🔍 Checking and adding missing permissions...');

    for (const perm of requiredPermissions) {
      // Check if permission exists
      let permission = await db('permissions').where('name', perm.name).first();
      
      if (!permission) {
        // Create the permission
        const [permId] = await db('permissions').insert({
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description
        });
        permission = { id: permId };
        console.log(`   ✅ Created permission: ${perm.name}`);
      } else {
        console.log(`   ℹ️  Permission exists: ${perm.name}`);
      }

      // Check if role has this permission
      const roleHasPermission = await db('role_permissions')
        .where('role_id', lawyerRole.id)
        .where('permission_id', permission.id)
        .first();

      if (!roleHasPermission) {
        // Assign permission to lawyer role
        await db('role_permissions').insert({
          role_id: lawyerRole.id,
          permission_id: permission.id
        });
        console.log(`   ✅ Assigned ${perm.name} to lawyer role`);
      } else {
        console.log(`   ℹ️  Role already has: ${perm.name}`);
      }
    }

    // Also ensure all lawyers have the lawyer role assigned
    console.log('\n👥 Checking lawyer role assignments...');
    
    const lawyersWithoutRole = await db('lawyers')
      .leftJoin('user_roles', function() {
        this.on('lawyers.id', '=', 'user_roles.user_id')
            .andOn('user_roles.user_type', '=', db.raw('?', ['lawyer']));
      })
      .whereNull('user_roles.id')
      .select('lawyers.id', 'lawyers.name', 'lawyers.email');

    console.log(`Found ${lawyersWithoutRole.length} lawyers without role assignment`);

    for (const lawyer of lawyersWithoutRole) {
      await db('user_roles').insert({
        user_id: lawyer.id,
        user_type: 'lawyer',
        role_id: lawyerRole.id
      });
      console.log(`   ✅ Assigned lawyer role to: ${lawyer.name || lawyer.email}`);
    }

    console.log('\n🎉 Free plan permissions fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Free plan lawyers can now create and manage:');
    console.log('     • Cases (existing)');
    console.log('     • Notes (added)');
    console.log('     • Events (added)');
    console.log('     • Tasks (added)');
    console.log('     • Contacts (added)');
    console.log('     • Calls (added)');
    console.log('     • Documents (existing)');
    console.log('   - All lawyers now have proper role assignments');

  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixFreePlanPermissions();