const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log('🔍 Modern Auth Conversion Verification\n');

let modernAuthCount = 0;
let legacyAuthCount = 0;
let noAuthCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  
  const hasModernAuth = content.includes('middleware/modernAuth');
  const hasLegacyAuth = content.includes('utils/middleware') || content.includes('middleware/auth');
  
  if (hasModernAuth) {
    modernAuthCount++;
    console.log(`✅ ${file} - Using Modern Auth`);
  } else if (hasLegacyAuth) {
    legacyAuthCount++;
    console.log(`❌ ${file} - Using Legacy Auth`);
  } else {
    noAuthCount++;
    console.log(`⚪ ${file} - No Auth`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Modern Auth: ${modernAuthCount} files`);
console.log(`❌ Legacy Auth: ${legacyAuthCount} files`);
console.log(`⚪ No Auth: ${noAuthCount} files`);
console.log(`📁 Total: ${files.length} files`);

if (legacyAuthCount === 0) {
  console.log('\n🎉 All routes successfully converted to Modern Auth!');
} else {
  console.log('\n⚠️  Some routes still need conversion');
}