const rbacService = require('./services/rbacService');
const db = require('./db');

async function migrateAllUsers() {
  try {
    console.log('🔄 Migrating all users to modern RBAC...');

    // Clear existing user roles to avoid duplicates
    await db('user_roles').del();
    console.log('✅ Cleared existing user roles');

    // Migrate users
    const users = await db('users').select('id', 'role', 'is_admin');
    console.log(`📊 Found ${users.length} users to migrate`);

    for (const user of users) {
      let roleName = 'user';
      if (user.is_admin || user.role === 'admin') {
        roleName = 'admin';
      }
      
      try {
        await rbacService.assignRole(user.id, 'user', roleName);
        console.log(`✅ User ${user.id} assigned role: ${roleName}`);
      } catch (error) {
        console.error(`❌ Failed to assign role to user ${user.id}:`, error.message);
      }
    }

    // Migrate lawyers
    const lawyers = await db('lawyers').select('id', 'is_verified', 'lawyer_verified');
    console.log(`📊 Found ${lawyers.length} lawyers to migrate`);

    for (const lawyer of lawyers) {
      let roleName = 'lawyer';
      if (lawyer.is_verified || lawyer.lawyer_verified) {
        roleName = 'verified_lawyer';
      }
      
      try {
        await rbacService.assignRole(lawyer.id, 'lawyer', roleName);
        console.log(`✅ Lawyer ${lawyer.id} assigned role: ${roleName}`);
      } catch (error) {
        console.error(`❌ Failed to assign role to lawyer ${lawyer.id}:`, error.message);
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Test a few users
    console.log('\n🧪 Testing migrated users...');
    
    if (users.length > 0) {
      const testUser = users[0];
      const abilities = await rbacService.getUserAbilities(testUser.id, 'user');
      console.log(`User ${testUser.id} can read payments:`, abilities.can('read', 'payments'));
    }
    
    if (lawyers.length > 0) {
      const testLawyer = lawyers[0];
      const abilities = await rbacService.getUserAbilities(testLawyer.id, 'lawyer');
      console.log(`Lawyer ${testLawyer.id} can write payments:`, abilities.can('write', 'payments'));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAllUsers();