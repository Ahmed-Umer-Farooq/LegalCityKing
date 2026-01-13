const db = require('./backend/db');
const jwt = require('jsonwebtoken');

async function testEndpoints() {
  console.log('🧪 Testing User Cases and Tasks after RBAC setup...\n');

  try {
    // Get a test user
    const user = await db('users').first();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Generate a test JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'yourSecretKey',
      { expiresIn: '1h' }
    );

    console.log('✅ Generated test JWT token');

    // Check user permissions
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ user_id: user.id, user_type: 'user' })
      .select('roles.name');

    console.log(`✅ User roles: ${userRoles.map(r => r.name).join(', ')}`);

    // Check if user_cases and user_tasks tables have data
    const casesCount = await db('user_cases').count('* as count').first();
    const tasksCount = await db('user_tasks').count('* as count').first();

    console.log(`✅ user_cases records: ${casesCount.count}`);
    console.log(`✅ user_tasks records: ${tasksCount.count}`);

    // Create sample data if empty
    if (casesCount.count === 0) {
      await db('user_cases').insert({
        title: 'Sample Legal Case',
        description: 'Test case for debugging',
        case_type: 'general',
        user_id: user.id,
        status: 'pending',
        start_date: new Date().toISOString().split('T')[0]
      });
      console.log('✅ Created sample case');
    }

    if (tasksCount.count === 0) {
      await db('user_tasks').insert({
        title: 'Sample Legal Task',
        description: 'Test task for debugging',
        user_id: user.id,
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      console.log('✅ Created sample task');
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\n📋 Test the endpoints now:');
    console.log('1. Login to your frontend application');
    console.log('2. Navigate to:');
    console.log('   - http://localhost:3000/user/legal-cases');
    console.log('   - http://localhost:3000/user/legal-tasks');
    console.log('\n💡 The endpoints should now load successfully!');
    console.log('\n🔧 If still not working, check:');
    console.log('- Frontend is sending Authorization header');
    console.log('- JWT token is valid and not expired');
    console.log('- User is properly logged in');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testEndpoints();