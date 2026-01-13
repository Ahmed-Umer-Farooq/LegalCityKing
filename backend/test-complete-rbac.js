const rbacService = require('./services/rbacService');

async function testCompleteRBAC() {
  try {
    console.log('🧪 Testing Complete Modern RBAC System\n');

    // Test different user types
    const testCases = [
      { id: 1, type: 'user', expectedRole: 'admin' },
      { id: 50, type: 'user', expectedRole: 'user' },
      { id: 50, type: 'lawyer', expectedRole: 'verified_lawyer' }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing ${testCase.type} ID: ${testCase.id}`);
      
      const roles = await rbacService.getUserRoles(testCase.id, testCase.type);
      console.log('Roles:', roles.map(r => r.name));
      
      const abilities = await rbacService.getUserAbilities(testCase.id, testCase.type);
      
      console.log('Permissions:');
      console.log('  - Can manage admin:', abilities.can('manage', 'admin'));
      console.log('  - Can read payments:', abilities.can('read', 'payments'));
      console.log('  - Can write payments:', abilities.can('write', 'payments'));
      console.log('  - Can manage cases:', abilities.can('manage', 'cases'));
      console.log('  - Can read documents:', abilities.can('read', 'documents'));
    }

    console.log('\n✅ Complete RBAC system test finished');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCompleteRBAC();