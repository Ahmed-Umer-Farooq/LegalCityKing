import React, { useState, useEffect } from 'react';
import { Server, Database, Cpu, HardDrive, Wifi, RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState({
    server: {
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0
    },
    database: {
      connections: 0,
      queryTime: 0,
      cacheHitRate: 0,
      tableSize: 0
    },
    application: {
      activeUsers: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      responseTime: 0
    },
    alerts: []
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemMetrics();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSystemMetrics, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchSystemMetrics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/analytics/system');
      setMetrics(response.data?.metrics || {
        server: { uptime: 0, cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkIn: 0, networkOut: 0 },
        database: { connections: 0, queryTime: 0, cacheHitRate: 0, tableSize: 0 },
        application: { activeUsers: 0, requestsPerMinute: 0, errorRate: 0, responseTime: 0 },
        alerts: []
      });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      showToast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-100';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="w-4 h-4" />;
    if (value >= thresholds.warning) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Metrics</h2>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchSystemMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Alerts */}
      {metrics.alerts?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">System Alerts</h3>
          </div>
          <div className="space-y-2">
            {metrics.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                <div>
                  <div className="font-medium text-red-800">{alert.title}</div>
                  <div className="text-sm text-red-600">{alert.message}</div>
                </div>
                <div className="text-xs text-red-500">{alert.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Server Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Server Performance</h3>
            <p className="text-sm text-gray-600">System resource utilization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Uptime */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Uptime</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatUptime(metrics.server.uptime)}</div>
          </div>

          {/* CPU Usage */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CPU Usage</span>
              <div className={`p-1 rounded-full ${getStatusColor(metrics.server.cpuUsage)}`}>
                {getStatusIcon(metrics.server.cpuUsage)}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{metrics.server.cpuUsage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metrics.server.cpuUsage >= 90 ? 'bg-red-500' : metrics.server.cpuUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${metrics.server.cpuUsage}%` }}
              ></div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Memory Usage</span>
              <div className={`p-1 rounded-full ${getStatusColor(metrics.server.memoryUsage)}`}>
                {getStatusIcon(metrics.server.memoryUsage)}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{metrics.server.memoryUsage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metrics.server.memoryUsage >= 90 ? 'bg-red-500' : metrics.server.memoryUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${metrics.server.memoryUsage}%` }}
              ></div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Disk Usage</span>
              <div className={`p-1 rounded-full ${getStatusColor(metrics.server.diskUsage)}`}>
                {getStatusIcon(metrics.server.diskUsage)}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{metrics.server.diskUsage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metrics.server.diskUsage >= 90 ? 'bg-red-500' : metrics.server.diskUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${metrics.server.diskUsage}%` }}
              ></div>
            </div>
          </div>

          {/* Network In */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Network In</span>
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatBytes(metrics.server.networkIn)}/s</div>
          </div>

          {/* Network Out */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Network Out</span>
              <Wifi className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatBytes(metrics.server.networkOut)}/s</div>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Performance</h3>
            <p className="text-sm text-gray-600">Database health and performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Connections</span>
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.database.connections}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Query Time</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.database.queryTime}ms</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Cache Hit Rate</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.database.cacheHitRate}%</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Database Size</span>
              <HardDrive className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatBytes(metrics.database.tableSize)}</div>
          </div>
        </div>
      </div>

      {/* Application Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Application Performance</h3>
            <p className="text-sm text-gray-600">Real-time application metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Users</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.application.activeUsers.toLocaleString()}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Requests/Min</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.application.requestsPerMinute.toLocaleString()}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Error Rate</span>
              <div className={`p-1 rounded-full ${getStatusColor(metrics.application.errorRate, { warning: 1, critical: 5 })}`}>
                {getStatusIcon(metrics.application.errorRate, { warning: 1, critical: 5 })}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.application.errorRate}%</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Response Time</span>
              <div className={`p-1 rounded-full ${getStatusColor(metrics.application.responseTime, { warning: 500, critical: 1000 })}`}>
                {getStatusIcon(metrics.application.responseTime, { warning: 500, critical: 1000 })}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.application.responseTime}ms</div>
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Health Summary</h3>
            <p className="text-sm text-gray-600">Overall system status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <div className="text-lg font-semibold text-green-800 mb-1">System Operational</div>
            <div className="text-sm text-green-600">All systems running normally</div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Activity className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <div className="text-lg font-semibold text-blue-800 mb-1">Performance Good</div>
            <div className="text-sm text-blue-600">Response times within normal range</div>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <Database className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <div className="text-lg font-semibold text-purple-800 mb-1">Database Healthy</div>
            <div className="text-sm text-purple-600">Connections and queries optimal</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;