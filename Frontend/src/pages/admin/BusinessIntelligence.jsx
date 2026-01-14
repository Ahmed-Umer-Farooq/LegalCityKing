import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Calendar, RefreshCw, Download, PieChart } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const BusinessIntelligence = () => {
  const [intelligence, setIntelligence] = useState({
    growth: {
      userGrowth: 0,
      lawyerGrowth: 0,
      revenueGrowth: 0,
      engagementGrowth: 0
    },
    performance: {
      topLawyers: [],
      topUsers: [],
      popularServices: [],
      regionAnalysis: []
    },
    trends: {
      monthlySignups: [],
      serviceUsage: [],
      satisfactionScores: []
    },
    predictions: {
      nextMonthRevenue: 0,
      expectedUsers: 0,
      churnRisk: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchBusinessIntelligence();
  }, [dateRange]);

  const fetchBusinessIntelligence = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/analytics/business', {
        params: { period: dateRange }
      });
      setIntelligence(response.data?.intelligence || {
        growth: { userGrowth: 0, lawyerGrowth: 0, revenueGrowth: 0, engagementGrowth: 0 },
        performance: { topLawyers: [], topUsers: [], popularServices: [], regionAnalysis: [] },
        trends: { monthlySignups: [], serviceUsage: [], satisfactionScores: [] },
        predictions: { nextMonthRevenue: 0, expectedUsers: 0, churnRisk: 0 }
      });
    } catch (error) {
      console.error('Error fetching business intelligence:', error);
      showToast.error('Failed to load business intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const exportData = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['User Growth', `${intelligence.growth.userGrowth}%`],
      ['Lawyer Growth', `${intelligence.growth.lawyerGrowth}%`],
      ['Revenue Growth', `${intelligence.growth.revenueGrowth}%`],
      ['Engagement Growth', `${intelligence.growth.engagementGrowth}%`],
      ['Predicted Next Month Revenue', intelligence.predictions.nextMonthRevenue],
      ['Expected Users', intelligence.predictions.expectedUsers],
      ['Churn Risk', `${intelligence.predictions.churnRisk}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Business intelligence data exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-600">Advanced analytics and business insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchBusinessIntelligence}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">User Growth</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPercentage(intelligence.growth.userGrowth)}</div>
              <div className={`text-xs font-medium ${intelligence.growth.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {intelligence.growth.userGrowth >= 0 ? '↗' : '↘'} vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Lawyer Growth</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPercentage(intelligence.growth.lawyerGrowth)}</div>
              <div className={`text-xs font-medium ${intelligence.growth.lawyerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {intelligence.growth.lawyerGrowth >= 0 ? '↗' : '↘'} vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Revenue Growth</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPercentage(intelligence.growth.revenueGrowth)}</div>
              <div className={`text-xs font-medium ${intelligence.growth.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {intelligence.growth.revenueGrowth >= 0 ? '↗' : '↘'} vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Engagement Growth</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPercentage(intelligence.growth.engagementGrowth)}</div>
              <div className={`text-xs font-medium ${intelligence.growth.engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {intelligence.growth.engagementGrowth >= 0 ? '↗' : '↘'} vs last period
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Signups</h3>
              <p className="text-sm text-gray-600">User and lawyer registrations</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {intelligence.trends.monthlySignups?.length > 0 ? (
              intelligence.trends.monthlySignups.map((data, index) => {
                const maxSignups = Math.max(...intelligence.trends.monthlySignups.map(d => d.total));
                const height = maxSignups > 0 ? (data.total / maxSignups) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ height: `${Math.max((data.users / maxSignups) * 100, 2)}%` }}
                        title={`Users: ${data.users}`}
                      ></div>
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ height: `${Math.max((data.lawyers / maxSignups) * 100, 2)}%` }}
                        title={`Lawyers: ${data.lawyers}`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {data.month}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No signup data available
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Lawyers</span>
            </div>
          </div>
        </div>

        {/* Service Usage Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Popular Services</h3>
              <p className="text-sm text-gray-600">Most used platform features</p>
            </div>
            <PieChart className="w-6 h-6 text-green-500" />
          </div>

          <div className="space-y-4">
            {intelligence.performance.popularServices?.length > 0 ? (
              intelligence.performance.popularServices.map((service, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                const maxUsage = Math.max(...intelligence.performance.popularServices.map(s => s.usage));
                const percentage = maxUsage > 0 ? (service.usage / maxUsage) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{service.usage}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No service usage data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Lawyers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Lawyers</h3>
              <p className="text-sm text-gray-600">Based on revenue and client satisfaction</p>
            </div>
            <Target className="w-6 h-6 text-purple-500" />
          </div>

          <div className="space-y-4">
            {intelligence.performance.topLawyers?.length > 0 ? (
              intelligence.performance.topLawyers.map((lawyer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{lawyer.name}</div>
                      <div className="text-sm text-gray-500">{lawyer.speciality}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(lawyer.revenue)}</div>
                    <div className="text-sm text-gray-500">{lawyer.rating}★ ({lawyer.reviews} reviews)</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No lawyer performance data available
              </div>
            )}
          </div>
        </div>

        {/* Regional Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Regional Analysis</h3>
              <p className="text-sm text-gray-600">User distribution by location</p>
            </div>
            <BarChart3 className="w-6 h-6 text-orange-500" />
          </div>

          <div className="space-y-4">
            {intelligence.performance.regionAnalysis?.length > 0 ? (
              intelligence.performance.regionAnalysis.map((region, index) => {
                const maxUsers = Math.max(...intelligence.performance.regionAnalysis.map(r => r.users));
                const percentage = maxUsers > 0 ? (region.users / maxUsers) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium text-gray-900 w-20">{region.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-orange-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-16 text-right">{region.users} users</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No regional data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Predictions</h3>
            <p className="text-sm text-gray-600">AI-powered forecasts and insights</p>
          </div>
          <Calendar className="w-6 h-6 text-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatCurrency(intelligence.predictions.nextMonthRevenue)}
            </div>
            <div className="text-sm text-gray-600">Predicted Next Month Revenue</div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {intelligence.predictions.expectedUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Expected New Users</div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {formatPercentage(intelligence.predictions.churnRisk)}
            </div>
            <div className="text-sm text-gray-600">Churn Risk Level</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;