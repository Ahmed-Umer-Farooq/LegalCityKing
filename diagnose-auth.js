const db = require('./backend/db');

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Authentication & RBAC Issues...\n');

  try {
    // Check if RBAC tables exist
    console.log('1. Checking RBAC tables...');
    const tables = ['roles', 'permissions', 'role_permissions', 'user_roles'];
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      console.log(`   ${table}: ${exists ? '✅' : '❌'}`);
      
      if (exists) {
        const count = await db(table).count('* as count').first();
        console.log(`   ${table} records: ${count.count}`);
      }
    }

    // Check sample user
    console.log('\n2. Checking users...');
    const users = await db('users').select('id', 'name', 'email', 'role', 'is_admin').limit(3);
    console.log('   Sample users:', users.length);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role || 'none'}, Admin: ${user.is_admin}`);
    });

    // Check user roles
    console.log('\n3. Checking user role assignments...');
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .select('user_roles.user_id', 'user_roles.user_type', 'roles.name as role_name')
      .limit(5);
    
    console.log('   User role assignments:', userRoles.length);
    userRoles.forEach(ur => {
      console.log(`   - User ${ur.user_id} (${ur.user_type}): ${ur.role_name}`);
    });

    // Check permissions
    console.log('\n4. Checking permissions...');
    const permissions = await db('permissions').select('action', 'resource', 'name').limit(10);
    console.log('   Available permissions:', permissions.length);
    permissions.forEach(p => {
      console.log(`   - ${p.action}:${p.resource} (${p.name})`);
    });

    // Check if user_cases and user_tasks tables exist
    console.log('\n5. Checking data tables...');
    const userCasesExists = await db.schema.hasTable('user_cases');
    const userTasksExists = await db.schema.hasTable('user_tasks');
    
    console.log(`   user_cases table: ${userCasesExists ? '✅' : '❌'}`);
    console.log(`   user_tasks table: ${userTasksExists ? '✅' : '❌'}`);

    if (userCasesExists) {
      const casesCount = await db('user_cases').count('* as count').first();
      console.log(`   user_cases records: ${casesCount.count}`);
    }

    if (userTasksExists) {
      const tasksCount = await db('user_tasks').count('* as count').first();
      console.log(`   user_tasks records: ${tasksCount.count}`);
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  } finally {
    process.exit(0);
  }
}

diagnoseAuth();