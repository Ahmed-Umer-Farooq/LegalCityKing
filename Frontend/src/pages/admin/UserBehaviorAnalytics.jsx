import React, { useState, useEffect } from 'react';
import { Users, Eye, TrendingUp, Clock, RefreshCw, BarChart3, Activity, Target } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const UserBehaviorAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    userEngagement: [],
    featureUsage: {
      totalCases: 0,
      messages30d: 0,
      blogs30d: 0,
      questions30d: 0,
      appointments30d: 0
    },
    sessionAnalytics: [],
    retentionAnalysis: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserBehavior();
  }, []);

  const fetchUserBehavior = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/security/behavior');
      setAnalytics(response.data || {
        userEngagement: [],
        featureUsage: { totalCases: 0, messages30d: 0, blogs30d: 0, questions30d: 0, appointments30d: 0 },
        sessionAnalytics: [],
        retentionAnalysis: []
      });
    } catch (error) {
      console.error('Error fetching user behavior:', error);
      showToast.error('Failed to load user behavior analytics');
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'churned': return 'bg-red-100 text-red-800';
      case 'never_logged_in': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Behavior Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600">User engagement and behavior patterns</p>
        </div>
        <button
          onClick={fetchUserBehavior}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Feature Usage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Total Cases</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{analytics.featureUsage.totalCases.toLocaleString()}</div>
          <div className="text-xs text-blue-600 font-medium">All time</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Messages</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{analytics.featureUsage.messages30d.toLocaleString()}</div>
          <div className="text-xs text-green-600 font-medium">Last 30 days</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Blog Posts</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{analytics.featureUsage.blogs30d.toLocaleString()}</div>
          <div className="text-xs text-purple-600 font-medium">Last 30 days</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Q&A</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{analytics.featureUsage.questions30d.toLocaleString()}</div>
          <div className="text-xs text-orange-600 font-medium">Last 30 days</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Appointments</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{analytics.featureUsage.appointments30d.toLocaleString()}</div>
          <div className="text-xs text-red-600 font-medium">Last 30 days</div>
        </div>
      </div>

      {/* User Engagement by Role */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Engagement by Role</h3>
            <p className="text-xs sm:text-sm text-gray-600">Active users and engagement metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {analytics.userEngagement?.length > 0 ? (
            analytics.userEngagement.map((engagement, index) => {
              const activePercentage = engagement.total_users > 0 
                ? Math.round((engagement.active_users / engagement.total_users) * 100)
                : 0;
              
              return (
                <div key={index} className="p-4 sm:p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                      {engagement.role || 'Unknown'}
                    </h4>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      activePercentage >= 70 ? 'bg-green-100 text-green-800' :
                      activePercentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activePercentage}% Active
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Users:</span>
                      <span className="font-medium">{engagement.total_users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Users:</span>
                      <span className="font-medium text-green-600">{engagement.active_users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Days to Login:</span>
                      <span className="font-medium">{Math.round(engagement.avg_days_to_first_login || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${activePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No user engagement data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Session Analytics and User Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Login Activity by Hour</h3>
              <p className="text-xs sm:text-sm text-gray-600">Peak usage times</p>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-1">
            {analytics.sessionAnalytics?.length > 0 ? (
              Array.from({ length: 24 }, (_, hour) => {
                const hourData = analytics.sessionAnalytics.find(s => s.hour === hour);
                const loginCount = hourData?.login_count || 0;
                const maxLogins = Math.max(...analytics.sessionAnalytics.map(s => s.login_count));
                const height = maxLogins > 0 ? (loginCount / maxLogins) * 100 : 0;
                
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${hour}:00 - ${loginCount} logins`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                      {hour}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No session data available
              </div>
            )}
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Retention Analysis</h3>
              <p className="text-xs sm:text-sm text-gray-600">User activity status</p>
            </div>
          </div>

          <div className="space-y-4">
            {analytics.retentionAnalysis?.length > 0 ? (
              analytics.retentionAnalysis.map((retention, index) => {
                const totalUsers = analytics.retentionAnalysis.reduce((sum, r) => sum + r.user_count, 0);
                const percentage = totalUsers > 0 ? Math.round((retention.user_count / totalUsers) * 100) : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRetentionColor(retention.status)}`}>
                        {retention.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {retention.user_count.toLocaleString()} users
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            retention.status === 'active' ? 'bg-green-500' :
                            retention.status === 'inactive' ? 'bg-yellow-500' :
                            retention.status === 'churned' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No retention data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBehaviorAnalytics;