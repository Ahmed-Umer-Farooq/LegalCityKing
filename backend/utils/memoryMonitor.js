const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const usage = {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`
  };
  console.log('💾 Memory:', usage);
  return usage;
};

const startMemoryMonitoring = (intervalMinutes = 10) => {
  logMemoryUsage();
  return setInterval(logMemoryUsage, intervalMinutes * 60 * 1000);
};

const forceGarbageCollection = () => {
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection triggered');
  }
};

module.exports = { logMemoryUsage, startMemoryMonitoring, forceGarbageCollection };
