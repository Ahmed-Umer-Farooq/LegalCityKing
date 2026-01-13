const db = require('./db');
const rbacService = require('./services/rbacService');

async function testLawyerPermissions() {
  console.log('🔍 Testing current lawyer permissions...\n');

  try {
    // Get the lawyer user (ID 51 from your earlier logs)
    const lawyerId = 51;
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    
    if (!lawyer) {
      console.log('❌ Lawyer not found');
      return;
    }

    console.log(`✅ Testing lawyer: ${lawyer.name} (${lawyer.email})`);

    // Check user roles
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ user_id: lawyerId, user_type: 'lawyer' })
      .select('roles.name');

    console.log(`Current roles: ${userRoles.map(r => r.name).join(', ')}`);

    // Get abilities
    const abilities = await rbacService.getUserAbilities(lawyerId, 'lawyer');
    
    // Test specific permissions
    const testPermissions = [
      'write:cases',
      'read:payment-records', 
      'read:dashboard',
      'read:invoices',
      'write:tasks'
    ];

    console.log('\nPermission Tests:');
    for (const perm of testPermissions) {
      const [action, resource] = perm.split(':');
      const canAccess = abilities.can(action, resource);
      console.log(`  ${perm}: ${canAccess ? '✅' : '❌'}`);
    }

    // Check if lawyer has any roles assigned
    if (userRoles.length === 0) {
      console.log('\n🔧 Assigning lawyer role...');
      await rbacService.assignRole(lawyerId, 'lawyer', 'lawyer');
      console.log('✅ Lawyer role assigned');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testLawyerPermissions();