const db = require('./db');
const rbacService = require('./services/rbacService');

async function testFreePlanPermissions() {
  try {
    console.log('🧪 Testing free plan lawyer permissions...\n');

    // Get a free plan lawyer
    const freeLawyer = await db('lawyers')
      .where('subscription_tier', 'free')
      .orWhereNull('subscription_tier')
      .first();

    if (!freeLawyer) {
      console.log('❌ No free plan lawyer found for testing');
      return;
    }

    console.log(`👤 Testing with lawyer: ${freeLawyer.name || freeLawyer.email} (ID: ${freeLawyer.id})`);
    console.log(`📋 Subscription tier: ${freeLawyer.subscription_tier || 'free'}\n`);

    // Test permissions
    const permissionsToTest = [
      { action: 'read', resource: 'cases', description: 'View cases' },
      { action: 'write', resource: 'cases', description: 'Create cases' },
      { action: 'read', resource: 'notes', description: 'View notes' },
      { action: 'write', resource: 'notes', description: 'Create notes' },
      { action: 'read', resource: 'events', description: 'View events' },
      { action: 'write', resource: 'events', description: 'Create events' },
      { action: 'read', resource: 'documents', description: 'View documents' },
      { action: 'write', resource: 'documents', description: 'Create documents' },
      { action: 'read', resource: 'clients', description: 'View clients' },
      { action: 'write', resource: 'clients', description: 'Create clients' },
      { action: 'read', resource: 'contacts', description: 'View contacts' },
      { action: 'write', resource: 'contacts', description: 'Create contacts' },
      { action: 'read', resource: 'tasks', description: 'View tasks' },
      { action: 'write', resource: 'tasks', description: 'Create tasks' },
      { action: 'read', resource: 'calls', description: 'View calls' },
      { action: 'write', resource: 'calls', description: 'Create calls' }
    ];

    console.log('🔍 Testing permissions:\n');

    let passedTests = 0;
    let totalTests = permissionsToTest.length;

    for (const test of permissionsToTest) {
      try {
        const hasPermission = await rbacService.can(freeLawyer.id, 'lawyer', test.action, test.resource);
        
        if (hasPermission) {
          console.log(`   ✅ ${test.description} (${test.action}:${test.resource})`);
          passedTests++;
        } else {
          console.log(`   ❌ ${test.description} (${test.action}:${test.resource})`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error testing ${test.description}: ${error.message}`);
      }
    }

    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} permissions working`);

    if (passedTests === totalTests) {
      console.log('🎉 All permissions are working correctly!');
      console.log('✅ Free plan lawyers can now create and manage basic data');
    } else {
      console.log('⚠️  Some permissions are still missing');
      console.log('💡 Run the migration or permission fix script');
    }

    // Test actual data creation
    console.log('\n🧪 Testing actual data creation...\n');

    try {
      // Test case creation
      const testCase = {
        lawyer_id: freeLawyer.id,
        title: 'Test Case - Free Plan',
        type: 'consultation',
        case_number: `TEST-${Date.now()}`,
        description: 'Test case created by free plan lawyer',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0]
      };

      const [caseId] = await db('cases').insert(testCase);
      console.log(`   ✅ Successfully created test case with ID: ${caseId}`);

      // Clean up test case
      await db('cases').where('id', caseId).del();
      console.log(`   🧹 Cleaned up test case`);

    } catch (error) {
      console.log(`   ❌ Failed to create test case: ${error.message}`);
    }

    try {
      // Test note creation
      const testNote = {
        lawyer_id: freeLawyer.id,
        title: 'Test Note - Free Plan',
        content: 'Test note created by free plan lawyer',
        is_private: true
      };

      const [noteId] = await db('notes').insert(testNote);
      console.log(`   ✅ Successfully created test note with ID: ${noteId}`);

      // Clean up test note
      await db('notes').where('id', noteId).del();
      console.log(`   🧹 Cleaned up test note`);

    } catch (error) {
      console.log(`   ❌ Failed to create test note: ${error.message}`);
    }

    console.log('\n🎯 Summary:');
    console.log('   - Free plan lawyers should now be able to:');
    console.log('     • Create and view cases');
    console.log('     • Create and view notes');
    console.log('     • Create and view events');
    console.log('     • Manage basic dashboard data');
    console.log('   - Dashboard should show real data instead of empty state');

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testFreePlanPermissions();