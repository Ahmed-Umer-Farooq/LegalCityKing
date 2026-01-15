const fs = require('fs');
const path = require('path');

const rotateLogs = () => {
  const logsDir = path.join(__dirname, '../logs');
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!fs.existsSync(logsDir)) return;

  const files = fs.readdirSync(logsDir);
  
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.size > maxSize) {
      const backup = `${filePath}.${Date.now()}.old`;
      fs.renameSync(filePath, backup);
      fs.writeFileSync(filePath, '');
      console.log(`📋 Rotated log: ${file}`);
      
      // Keep only last 3 backups
      const backups = files.filter(f => f.startsWith(file) && f.endsWith('.old'))
        .sort().reverse().slice(3);
      backups.forEach(b => fs.unlinkSync(path.join(logsDir, b)));
    }
  });
};

const startLogRotation = () => {
  rotateLogs();
  return setInterval(rotateLogs, 60 * 60 * 1000); // Every hour
};

module.exports = { rotateLogs, startLogRotation };
