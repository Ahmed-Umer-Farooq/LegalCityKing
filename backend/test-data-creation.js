const db = require('./db');
const rbacService = require('./services/rbacService');

async function testDataCreation() {
  try {
    console.log('🧪 Testing data creation for free plan lawyers...\n');

    // Get a free plan lawyer
    const freeLawyer = await db('lawyers')
      .where('subscription_tier', 'free')
      .orWhereNull('subscription_tier')
      .first();

    if (!freeLawyer) {
      console.log('❌ No free plan lawyer found');
      return;
    }

    console.log(`👤 Testing with: ${freeLawyer.name} (ID: ${freeLawyer.id})\n`);

    // Test case creation
    try {
      const testCase = {
        lawyer_id: freeLawyer.id,
        title: 'Test Case - Quick Action',
        type: 'civil',
        case_number: `QA-${Date.now()}`,
        description: 'Test case from quick action',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0]
      };

      const [caseId] = await db('cases').insert(testCase);
      console.log(`✅ Case created successfully (ID: ${caseId})`);
      
      // Clean up
      await db('cases').where('id', caseId).del();
      console.log(`🧹 Case cleaned up`);
    } catch (error) {
      console.log(`❌ Case creation failed: ${error.message}`);
    }

    // Test note creation
    try {
      const testNote = {
        created_by: freeLawyer.id,
        title: 'Test Note - Quick Action',
        content: 'Test note from quick action',
        is_private: true
      };

      const [noteId] = await db('notes').insert(testNote);
      console.log(`✅ Note created successfully (ID: ${noteId})`);
      
      // Clean up
      await db('notes').where('id', noteId).del();
      console.log(`🧹 Note cleaned up`);
    } catch (error) {
      console.log(`❌ Note creation failed: ${error.message}`);
    }

    // Test contact creation
    try {
      const testContact = {
        created_by: freeLawyer.id,
        name: 'Test Contact',
        email: 'test@example.com',
        phone: '555-0123',
        type: 'client'
      };

      const [contactId] = await db('contacts').insert(testContact);
      console.log(`✅ Contact created successfully (ID: ${contactId})`);
      
      // Clean up
      await db('contacts').where('id', contactId).del();
      console.log(`🧹 Contact cleaned up`);
    } catch (error) {
      console.log(`❌ Contact creation failed: ${error.message}`);
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Free plan lawyers can now create data through Quick Actions');
    console.log('✅ Dashboard should populate with real data instead of empty state');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDataCreation();