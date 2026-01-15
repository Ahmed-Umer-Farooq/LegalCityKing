import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertTriangle, XCircle, RefreshCw, Server, Database, Wifi } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const PlatformHealth = () => {
  const [health, setHealth] = useState({
    overall: 'healthy',
    services: [],
    uptime: 99.9,
    incidents: [],
    metrics: {
      responseTime: 0,
      throughput: 0,
      errorRate: 0
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlatformHealth();
    const interval = setInterval(fetchPlatformHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPlatformHealth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/security/health');
      const data = response.data || {};
      
      const avgResponseTime = data.apiHealth?.length > 0 
        ? Math.round(data.apiHealth.reduce((sum, api) => sum + api.avg_response_time, 0) / data.apiHealth.length)
        : 0;
      
      const transformedHealth = {
        overall: 'healthy',
        services: [],
        uptime: 0,
        incidents: [],
        metrics: {
          responseTime: avgResponseTime,
          throughput: 0,
          errorRate: 0
        },
        databaseHealth: data.databaseHealth || [],
        apiHealth: data.apiHealth || [],
        systemResources: data.systemResources || null
      };
      
      setHealth(transformedHealth);
    } catch (error) {
      console.error('Error fetching platform health:', error);
      showToast.error('Failed to load platform health data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'down': return <XCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getServiceIcon = (serviceName) => {
    if (serviceName.toLowerCase().includes('database')) return <Database className="w-5 h-5" />;
    if (serviceName.toLowerCase().includes('server') || serviceName.toLowerCase().includes('api')) return <Server className="w-5 h-5" />;
    return <Wifi className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Health</h2>
          <p className="text-gray-600">Real-time system health monitoring</p>
        </div>
        <button
          onClick={fetchPlatformHealth}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {health.metrics.responseTime > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">API Performance</h3>
              <p className="text-sm text-gray-600">Average response time across all endpoints</p>
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-1">{health.metrics.responseTime}ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
      )}

      {/* Database Health & API Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Database Health</h3>
              <p className="text-sm text-gray-600">Top database tables by size</p>
            </div>
          </div>

          <div className="space-y-3">
            {health.databaseHealth?.length > 0 ? (
              health.databaseHealth.slice(0, 5).map((table, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{table.table_name}</div>
                    <div className="text-sm text-gray-500">{table.table_rows?.toLocaleString()} rows</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{table.size_mb} MB</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Database health data loading...</p>
              </div>
            )}
          </div>
        </div>

        {/* API Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">API Performance</h3>
              <p className="text-sm text-gray-600">Endpoint response times</p>
            </div>
          </div>

          <div className="space-y-3">
            {health.apiHealth?.length > 0 ? (
              health.apiHealth.map((api, index) => {
                const responseTime = api.avg_response_time;
                const successRate = api.success_rate;
                const statusColor = successRate >= 99 ? 'text-green-600' : successRate >= 95 ? 'text-yellow-600' : 'text-red-600';
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{api.endpoint}</div>
                      <div className="text-sm text-gray-500">{responseTime}ms avg</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${statusColor}`}>{successRate}%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Server className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>API performance data loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Resources */}
      {health.systemResources && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Resources</h3>
              <p className="text-sm text-gray-600">Current resource utilization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{health.systemResources.cpu_usage}%</div>
              <div className="text-sm text-gray-600">CPU Usage</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${health.systemResources.cpu_usage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{health.systemResources.memory_usage}%</div>
              <div className="text-sm text-gray-600">Memory Usage</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${health.systemResources.memory_usage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">{health.systemResources.disk_usage}%</div>
              <div className="text-sm text-gray-600">Disk Usage</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-orange-500 rounded-full"
                  style={{ width: `${health.systemResources.disk_usage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{health.systemResources.active_connections}</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default PlatformHealth;