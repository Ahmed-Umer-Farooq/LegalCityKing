const db = require('./db');
const rbacService = require('./services/rbacService');

async function fixUserPermissions() {
  console.log('🔧 Fixing permissions for user ID: 88...\n');

  try {
    const userId = 88;
    
    // Check if user exists
    const user = await db('users').where('id', userId).first();
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Check current roles
    const currentRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ user_id: userId, user_type: 'user' })
      .select('roles.name');

    console.log(`Current roles: ${currentRoles.map(r => r.name).join(', ') || 'none'}`);

    // Assign user role if not exists
    if (currentRoles.length === 0) {
      await rbacService.assignRole(userId, 'user', 'user');
      console.log('✅ Assigned "user" role');
    }

    // Clear cache and verify permissions
    rbacService.clearUserCache(userId, 'user');
    
    const abilities = await rbacService.getUserAbilities(userId, 'user');
    console.log('✅ Permissions refreshed');

    // Test permissions
    const canReadCases = abilities.can('read', 'cases');
    const canReadTasks = abilities.can('read', 'tasks');
    
    console.log(`Can read cases: ${canReadCases}`);
    console.log(`Can read tasks: ${canReadTasks}`);

    console.log('\n🎉 User permissions fixed!');
    console.log('Now try accessing the pages again.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixUserPermissions();