const { logMemoryUsage } = require('../utils/memoryMonitor');
const socketUserManager = require('../utils/socketUserManager');
const cache = require('../utils/simpleCache');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const getSystemMetrics = async (req, res) => {
  try {
    // Memory metrics
    const memory = process.memoryUsage();
    const memoryMetrics = {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      heapUsedPercent: Math.round((memory.heapUsed / memory.heapTotal) * 100)
    };

    // Database pool stats
    const dbPool = db.client.pool;
    const dbMetrics = {
      maxConnections: 5,
      activeConnections: dbPool.numUsed(),
      idleConnections: dbPool.numFree(),
      pendingRequests: dbPool.numPendingAcquires()
    };

    // Socket metrics
    const socketStats = socketUserManager.users;
    const socketMetrics = {
      activeUsers: socketStats.size,
      activeCalls: socketUserManager.getActiveCalls().length
    };

    // Cache metrics
    const cacheStats = cache.getStats();
    const cacheMetrics = {
      cachedItems: cacheStats.size,
      cacheKeys: cacheStats.keys.length
    };

    // Log file sizes
    const logsDir = path.join(__dirname, '../logs');
    let logMetrics = { totalSize: 0, files: [] };
    
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      let totalSize = 0;
      
      const fileStats = files.map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        return {
          name: file,
          size: Math.round(stats.size / 1024), // KB
          modified: stats.mtime
        };
      });

      logMetrics = {
        totalSize: Math.round(totalSize / 1024 / 1024), // MB
        files: fileStats
      };
    }

    // System uptime
    const uptime = process.uptime();
    const uptimeMetrics = {
      seconds: Math.round(uptime),
      formatted: formatUptime(uptime)
    };

    // Optimization status
    const optimizations = {
      socketCleanup: { enabled: true, interval: '5 minutes' },
      dbPoolOptimized: { enabled: true, maxConnections: 5 },
      bodyParserLimit: { enabled: true, limit: '2MB' },
      fileUploadLimit: { enabled: true, maxFiles: 5 },
      memoryMonitoring: { enabled: true, interval: '10 minutes' },
      logRotation: { enabled: true, interval: 'hourly', maxSize: '5MB' },
      gracefulShutdown: { enabled: true }
    };

    res.json({
      memory: memoryMetrics,
      database: dbMetrics,
      sockets: socketMetrics,
      cache: cacheMetrics,
      logs: logMetrics,
      uptime: uptimeMetrics,
      optimizations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

module.exports = { getSystemMetrics };
