const rbacService = require('./services/rbacService');

async function clearAllCache() {
  console.log('🔄 Clearing RBAC cache for all users...\n');
  
  // Clear the entire cache
  rbacService.cache.clear();
  
  console.log('✅ RBAC cache cleared successfully!');
  console.log('All users will get fresh permissions on next request.');
  
  process.exit(0);
}

clearAllCache();