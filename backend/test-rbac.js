const rbacService = require('./services/rbacService');

async function testRBAC() {
  try {
    console.log('Testing RBAC System...\n');

    // Test user abilities
    const userId = 50; // Replace with actual lawyer ID
    const userType = 'lawyer';

    console.log(`Testing abilities for ${userType} ID: ${userId}`);
    
    const abilities = await rbacService.getUserAbilities(userId, userType);
    
    console.log('Can write payments:', abilities.can('write', 'payments'));
    console.log('Can read payments:', abilities.can('read', 'payments'));
    console.log('Can manage cases:', abilities.can('manage', 'cases'));
    console.log('Can manage admin:', abilities.can('manage', 'admin'));

    // Test user roles
    const roles = await rbacService.getUserRoles(userId, userType);
    console.log('\\nUser roles:', roles.map(r => r.name));

    console.log('\\n✅ RBAC test completed');
  } catch (error) {
    console.error('❌ RBAC test failed:', error);
  }
  
  process.exit(0);
}

testRBAC();