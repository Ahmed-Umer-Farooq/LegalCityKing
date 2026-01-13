const fs = require('fs');
const path = require('path');

function auditRoutes() {
  const routesDir = path.join(__dirname, 'routes');
  const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  
  console.log('🔍 Auditing Authentication in Routes\n');
  
  const results = {
    modern: [],
    legacy: [],
    mixed: []
  };
  
  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasModernAuth = content.includes('require(\'../middleware/modernAuth\')') || 
                         content.includes('authenticate') && content.includes('authorize');
    const hasLegacyAuth = content.includes('authenticateToken') || 
                         content.includes('requireAuth') || 
                         content.includes('authenticateLawyer');
    
    if (hasModernAuth && !hasLegacyAuth) {
      results.modern.push(file);
    } else if (hasLegacyAuth && !hasModernAuth) {
      results.legacy.push(file);
    } else if (hasModernAuth && hasLegacyAuth) {
      results.mixed.push(file);
    }
  });
  
  console.log('✅ Modern RBAC Authentication:');
  results.modern.forEach(file => console.log(`   - ${file}`));
  
  console.log('\n❌ Legacy Authentication (needs update):');
  results.legacy.forEach(file => console.log(`   - ${file}`));
  
  console.log('\n⚠️  Mixed Authentication (needs cleanup):');
  results.mixed.forEach(file => console.log(`   - ${file}`));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Modern: ${results.modern.length}`);
  console.log(`   Legacy: ${results.legacy.length}`);
  console.log(`   Mixed: ${results.mixed.length}`);
  console.log(`   Total: ${files.length}`);
  
  if (results.legacy.length === 0 && results.mixed.length === 0) {
    console.log('\n🎉 All routes are using modern RBAC authentication!');
  } else {
    console.log('\n⚠️  Some routes still need to be updated to modern RBAC.');
  }
}

auditRoutes();