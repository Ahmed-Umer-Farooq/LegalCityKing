import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart, Calendar, RefreshCw, Download, Target } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const FinancialAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      monthly: 0,
      growth: 0,
      trends: []
    },
    transactions: {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0
    },
    subscriptions: {
      mrr: 0,
      arr: 0,
      churn: 0,
      ltv: 0
    },
    topPerformers: []
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchFinancialAnalytics();
  }, [dateRange]);

  const fetchFinancialAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/analytics/financial', {
        params: { period: dateRange }
      });
      setAnalytics(response.data?.analytics || {
        revenue: { total: 0, monthly: 0, growth: 0, trends: [] },
        transactions: { total: 0, successful: 0, failed: 0, pending: 0 },
        subscriptions: { mrr: 0, arr: 0, churn: 0, ltv: 0 },
        topPerformers: []
      });
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      showToast.error('Failed to load financial analytics');
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
      ['Total Revenue', analytics.revenue.total],
      ['Monthly Revenue', analytics.revenue.monthly],
      ['Revenue Growth', `${analytics.revenue.growth}%`],
      ['Total Transactions', analytics.transactions.total],
      ['Successful Transactions', analytics.transactions.successful],
      ['Failed Transactions', analytics.transactions.failed],
      ['MRR', analytics.subscriptions.mrr],
      ['ARR', analytics.subscriptions.arr],
      ['Churn Rate', `${analytics.subscriptions.churn}%`],
      ['Customer LTV', analytics.subscriptions.ltv]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Financial data exported successfully');
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600">Comprehensive financial performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={fetchFinancialAnalytics}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Total Revenue</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(analytics.revenue.total)}</div>
              <div className={`text-xs font-medium ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.revenue.growth >= 0 ? '+' : ''}{formatPercentage(analytics.revenue.growth)} from last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Monthly Revenue</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(analytics.revenue.monthly)}</div>
              <div className="text-xs text-blue-600 font-medium">Current month</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">MRR</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(analytics.subscriptions.mrr)}</div>
              <div className="text-xs text-purple-600 font-medium">Monthly Recurring Revenue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Customer LTV</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(analytics.subscriptions.ltv)}</div>
              <div className="text-xs text-orange-600 font-medium">Lifetime Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-xs sm:text-sm text-gray-600">Daily revenue over time</p>
            </div>
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.revenue.trends?.length > 0 ? (
              analytics.revenue.trends.map((data, index) => {
                const maxRevenue = Math.max(...analytics.revenue.trends.map(d => d.amount));
                const height = maxRevenue > 0 ? (data.amount / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${data.date}: ${formatCurrency(data.amount)}`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction Status</h3>
              <p className="text-xs sm:text-sm text-gray-600">Payment success rates</p>
            </div>
            <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              {analytics.transactions.total > 0 ? (
                <>
                  <div 
                    className="absolute inset-0 rounded-full" 
                    style={{
                      background: `conic-gradient(
                        #10B981 0deg ${(analytics.transactions.successful / analytics.transactions.total) * 360}deg,
                        #F59E0B ${(analytics.transactions.successful / analytics.transactions.total) * 360}deg ${((analytics.transactions.successful + analytics.transactions.pending) / analytics.transactions.total) * 360}deg,
                        #EF4444 ${((analytics.transactions.successful + analytics.transactions.pending) / analytics.transactions.total) * 360}deg 360deg
                      )`
                    }}
                  ></div>
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{analytics.transactions.total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No data</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Successful</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.transactions.successful}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.transactions.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Failed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.transactions.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ARR</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(analytics.subscriptions.arr)}</div>
          <p className="text-sm text-gray-600">Annual Recurring Revenue</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Churn Rate</h3>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{formatPercentage(analytics.subscriptions.churn)}</div>
          <p className="text-sm text-gray-600">Monthly churn rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {analytics.transactions.total > 0 
              ? formatPercentage((analytics.transactions.successful / analytics.transactions.total) * 100)
              : '0%'
            }
          </div>
          <p className="text-sm text-gray-600">Payment success rate</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Lawyers</h3>
          <p className="text-sm text-gray-600">Highest revenue generators</p>
        </div>
        <div className="p-6">
          {analytics.topPerformers?.length > 0 ? (
            <div className="space-y-4">
              {analytics.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{performer.name}</div>
                      <div className="text-sm text-gray-500">{performer.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(performer.revenue)}</div>
                    <div className="text-sm text-gray-500">{performer.transactions} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No performance data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;