const db = require('./backend/db');
const rbacService = require('./backend/services/rbacService');

async function fixRBACAndTest() {
  console.log('🔧 Setting up RBAC and testing endpoints...\n');

  try {
    // Check database connection
    console.log('1. Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    // Check if RBAC tables exist
    console.log('\n2. Checking RBAC tables...');
    const rbacTables = ['roles', 'permissions', 'role_permissions', 'user_roles'];
    let allTablesExist = true;

    for (const table of rbacTables) {
      const exists = await db.schema.hasTable(table);
      console.log(`   ${table}: ${exists ? '✅' : '❌'}`);
      if (!exists) allTablesExist = false;
    }

    if (!allTablesExist) {
      console.log('\n⚠️ RBAC tables missing. Running RBAC migration...');
      try {
        // Run RBAC setup script
        const { execSync } = require('child_process');
        execSync('node setup-rbac.js', { cwd: './backend', stdio: 'inherit' });
        console.log('✅ RBAC setup completed');
      } catch (error) {
        console.log('❌ RBAC setup failed:', error.message);
      }
    }

    // Check user tables
    console.log('\n3. Checking user data tables...');
    const userCasesExists = await db.schema.hasTable('user_cases');
    const userTasksExists = await db.schema.hasTable('user_tasks');
    
    console.log(`   user_cases: ${userCasesExists ? '✅' : '❌'}`);
    console.log(`   user_tasks: ${userTasksExists ? '✅' : '❌'}`);

    // Create sample data if tables exist but are empty
    if (userCasesExists) {
      const casesCount = await db('user_cases').count('* as count').first();
      console.log(`   user_cases records: ${casesCount.count}`);
      
      if (casesCount.count === 0) {
        console.log('   Creating sample case...');
        await db('user_cases').insert({
          title: 'Sample Legal Case',
          description: 'This is a sample case for testing',
          case_type: 'general',
          user_id: 1,
          status: 'pending',
          start_date: new Date().toISOString().split('T')[0]
        });
        console.log('   ✅ Sample case created');
      }
    }

    if (userTasksExists) {
      const tasksCount = await db('user_tasks').count('* as count').first();
      console.log(`   user_tasks records: ${tasksCount.count}`);
      
      if (tasksCount.count === 0) {
        console.log('   Creating sample task...');
        await db('user_tasks').insert({
          title: 'Sample Legal Task',
          description: 'This is a sample task for testing',
          user_id: 1,
          priority: 'medium',
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        console.log('   ✅ Sample task created');
      }
    }

    // Check users and assign roles
    console.log('\n4. Checking user roles...');
    const users = await db('users').select('id', 'name', 'email').limit(3);
    console.log(`   Found ${users.length} users`);

    for (const user of users) {
      try {
        const existingRoles = await db('user_roles')
          .where({ user_id: user.id, user_type: 'user' })
          .count('* as count')
          .first();

        if (existingRoles.count === 0) {
          console.log(`   Assigning 'user' role to ${user.name}...`);
          await rbacService.assignRole(user.id, 'user', 'user');
          console.log('   ✅ Role assigned');
        } else {
          console.log(`   ${user.name} already has roles assigned`);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not assign role to ${user.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Setup completed! The endpoints should now work properly.');
    console.log('\n📋 Test the endpoints:');
    console.log('   - http://localhost:3000/user/legal-cases');
    console.log('   - http://localhost:3000/user/legal-tasks');
    console.log('\n💡 Make sure you are logged in as a user to access these endpoints.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check database credentials in backend/.env');
    console.log('3. Run: cd backend && npm run migrate');
    console.log('4. Run: cd backend && node setup-rbac.js');
  } finally {
    process.exit(0);
  }
}

fixRBACAndTest();