const db = require('./db');
const rbacService = require('./services/rbacService');

async function migrateAllLawyers() {
  console.log('🔄 Migrating all lawyers to RBAC system...\n');

  try {
    // Get all lawyers
    const lawyers = await db('lawyers').select('id', 'name', 'email', 'is_verified');
    console.log(`Found ${lawyers.length} lawyers to migrate`);

    for (const lawyer of lawyers) {
      // Check if lawyer already has roles
      const existingRoles = await db('user_roles')
        .where({ user_id: lawyer.id, user_type: 'lawyer' })
        .count('* as count')
        .first();

      if (existingRoles.count === 0) {
        const roleName = lawyer.is_verified ? 'verified_lawyer' : 'lawyer';
        await rbacService.assignRole(lawyer.id, 'lawyer', roleName);
        console.log(`✅ Assigned ${roleName} role to ${lawyer.name}`);
      } else {
        console.log(`⏭️ ${lawyer.name} already has roles`);
      }
    }

    // Clear cache
    rbacService.cache.clear();
    console.log('\n✅ RBAC cache cleared');
    console.log('🎉 All lawyers migrated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

migrateAllLawyers();