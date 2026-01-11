import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Shield, AlertTriangle, Eye, Ban, RefreshCw, Search,
  FileX, MessageSquareX, Link2Off, Activity, Clock,
  Users, TrendingUp, XCircle, CheckCircle
} from 'lucide-react';

const SecurityMonitor = () => {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [chatAudit, setChatAudit] = useState([]);
  const [securityStats, setSecurityStats] = useState({});
  const [quarantinedFiles, setQuarantinedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    fetchSecurityData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [eventsRes, auditRes, statsRes, quarantineRes] = await Promise.all([
        api.get('/admin/security/events'),
        api.get('/admin/security/chat-audit'),
        api.get('/admin/security/stats'),
        api.get('/admin/security/quarantine')
      ]);
      
      setSecurityEvents(eventsRes.data?.events || []);
      setChatAudit(auditRes.data?.activities || []);
      setSecurityStats(statsRes.data || {});
      setQuarantinedFiles(quarantineRes.data?.files || []);
    } catch (error) {
      console.error('Error fetching security data:', error);
    }
    setLoading(false);
  };

  const handleBlockUser = async (userId, userType, reason) => {
    try {
      await api.post('/admin/security/block-user', {
        userId,
        userType,
        reason
      });
      alert('User blocked successfully');
      fetchSecurityData();
    } catch (error) {
      alert('Failed to block user');
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.userId?.toString().includes(searchQuery) ||
      event.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = eventFilter === 'all' || event.type === eventFilter;
    
    return matchesSearch && matchesFilter;
  });

  const renderSecurityStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Security Events</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{securityStats.security?.totalEvents || 0}</div>
            <div className="text-xs text-red-600 font-medium">Last 24h: {securityStats.security?.last24h || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <MessageSquareX className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Spam Blocked</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{securityStats.threats?.spamDetected || 0}</div>
            <div className="text-xs text-orange-600 font-medium">Messages blocked</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Link2Off className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Malicious Links</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{securityStats.threats?.maliciousLinks || 0}</div>
            <div className="text-xs text-purple-600 font-medium">Links blocked</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <FileX className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Files Quarantined</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{quarantinedFiles.length}</div>
            <div className="text-xs text-blue-600 font-medium">Malicious files</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      {renderSecurityStats()}
      
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Security Events ({securityEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Chat Audit ({chatAudit.length})
            </button>
            <button
              onClick={() => setActiveTab('quarantine')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'quarantine'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Quarantined Files ({quarantinedFiles.length})
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search security events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={fetchSecurityData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No security events found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">{event.type}</span>
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              {event.code || 'SECURITY'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{event.reason}</p>
                          <p className="text-xs text-gray-500">
                            User: {event.userId} ({event.userType}) | {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.userId && (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter reason for blocking user:');
                              if (reason) {
                                handleBlockUser(event.userId, event.userType, reason);
                              }
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                            title="Block User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {chatAudit.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No chat activities found</p>
                </div>
              ) : (
                chatAudit.map((activity, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {activity.userType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">User: {activity.userId}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'quarantine' && (
            <div className="space-y-3">
              {quarantinedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p>No quarantined files - system is secure!</p>
                </div>
              ) : (
                quarantinedFiles.map((file, index) => (
                  <div key={index} className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileX className="w-5 h-5 text-red-500" />
                        <div>
                          <div className="font-medium text-gray-900">{file.originalName}</div>
                          <div className="text-sm text-gray-500">
                            Size: {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        QUARANTINED
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;