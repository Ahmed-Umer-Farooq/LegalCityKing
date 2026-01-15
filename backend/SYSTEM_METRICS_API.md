# System Metrics API

## Endpoint
`GET /api/admin/system-metrics`

## Authentication
Requires admin authentication with `manage:all` permission

## Response Format
```json
{
  "memory": {
    "rss": 177,              // Total memory (MB)
    "heapTotal": 124,        // Heap allocated (MB)
    "heapUsed": 84,          // Heap used (MB)
    "external": 3,           // External memory (MB)
    "heapUsedPercent": 68    // Heap usage percentage
  },
  "database": {
    "maxConnections": 5,
    "activeConnections": 2,
    "idleConnections": 3,
    "pendingRequests": 0
  },
  "sockets": {
    "activeUsers": 5,
    "activeCalls": 2
  },
  "cache": {
    "cachedItems": 10,
    "cacheKeys": 10
  },
  "logs": {
    "totalSize": 0,          // MB
    "files": [
      {
        "name": "combined.log",
        "size": 97,            // KB
        "modified": "2026-01-14T..."
      }
    ]
  },
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "optimizations": {
    "socketCleanup": { "enabled": true, "interval": "5 minutes" },
    "dbPoolOptimized": { "enabled": true, "maxConnections": 5 },
    "bodyParserLimit": { "enabled": true, "limit": "2MB" },
    "fileUploadLimit": { "enabled": true, "maxFiles": 5 },
    "memoryMonitoring": { "enabled": true, "interval": "10 minutes" },
    "logRotation": { "enabled": true, "interval": "hourly", "maxSize": "5MB" },
    "gracefulShutdown": { "enabled": true }
  },
  "timestamp": "2026-01-14T..."
}
```

## Frontend Integration

### Admin Dashboard URL
`http://localhost:3000/admin-dashboard?tab=system-metrics`

### Example Fetch
```javascript
const fetchSystemMetrics = async () => {
  const response = await fetch('/api/admin/system-metrics', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};
```

## Metrics Explained

### Memory
- **RSS**: Total memory used by the process
- **Heap Used**: JavaScript heap memory in use
- **Heap Total**: Total allocated heap
- **External**: C++ objects bound to JavaScript

### Database
- **Active Connections**: Currently executing queries
- **Idle Connections**: Available for use
- **Pending Requests**: Waiting for connection

### Optimizations Status
All optimizations are enabled and show:
- ✅ Socket cleanup every 5 minutes
- ✅ DB pool limited to 5 connections
- ✅ Body parser limited to 2MB
- ✅ File uploads limited to 5 files
- ✅ Memory monitoring every 10 minutes
- ✅ Log rotation hourly (5MB max)
- ✅ Graceful shutdown handlers

## Benefits
- Real-time system health monitoring
- Track memory optimization effectiveness
- Monitor database connection usage
- View active users and calls
- Check log file sizes
- Verify all optimizations are active
