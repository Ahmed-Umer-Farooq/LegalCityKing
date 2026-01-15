import React, { useState, useEffect } from 'react';
import { CreditCard, Users, TrendingUp, Calendar, RefreshCw, Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    churnRate: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    billing_cycle: 'monthly',
    features: [],
    stripe_price_id: '',
    is_free: false
  });
  const [newFeature, setNewFeature] = useState('');
  const [restrictions, setRestrictions] = useState({
    free: { cases: 5, clients: 10, documents: 20, blogs: 3, qa_answers: 5, payment_links: 2, quick_actions: false, payment_records: false, calendar: false, contacts: false, messages: false },
    professional: { cases: 50, clients: 100, documents: 500, blogs: 20, qa_answers: 50, payment_links: 20, quick_actions: true, payment_records: true, calendar: true, contacts: true, messages: true },
    premium: { cases: -1, clients: -1, documents: -1, blogs: -1, qa_answers: -1, payment_links: -1, quick_actions: true, payment_records: true, calendar: true, contacts: true, messages: true }
  });

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      fetchPlans();
    }
    fetchSubscriptionStats();
  }, [pagination.page, search, filter, activeTab]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/management/subscriptions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
          status: filter === 'all' ? undefined : filter
        }
      });
      
      setSubscriptions(response.data?.subscriptions || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/subscription-plans');
      setPlans(response.data?.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      const response = await api.get('/admin/subscription-stats');
      setStats(response.data?.stats || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        churnRate: 0
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await api.post('/admin/subscription-plans', {
        ...planForm,
        price: planForm.is_free ? 0 : planForm.price,
        features: planForm.features
      });
      showToast.success('Plan created successfully');
      setShowPlanModal(false);
      setPlanForm({ name: '', price: '', billing_cycle: 'monthly', features: [], stripe_price_id: '', is_free: false });
      setNewFeature('');
      fetchPlans();
    } catch (error) {
      showToast.error('Failed to create plan');
    }
  };

  const handleUpdatePlan = async () => {
    try {
      await api.put(`/admin/subscription-plans/${editingPlan.id}`, {
        ...planForm,
        price: planForm.is_free ? 0 : planForm.price,
        features: planForm.features,
        active: true
      });
      showToast.success('Plan updated successfully');
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: '', price: '', billing_cycle: 'monthly', features: [], stripe_price_id: '', is_free: false });
      setNewFeature('');
      await fetchPlans();
      await fetchSubscriptionStats();
    } catch (error) {
      showToast.error('Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to deactivate this plan?')) {
      try {
        await api.delete(`/admin/subscription-plans/${planId}`);
        showToast.success('Plan deactivated successfully');
        fetchPlans();
      } catch (error) {
        showToast.error('Failed to delete plan');
      }
    }
  };

  const openEditModal = (plan) => {
    const featuresString = plan.features || '';
    let featuresArray = [];
    
    try {
      if (typeof featuresString === 'string') {
        if (featuresString.startsWith('[')) {
          featuresArray = JSON.parse(featuresString);
        } else {
          featuresArray = featuresString.split(', ').filter(f => f.trim());
        }
      } else if (Array.isArray(featuresString)) {
        featuresArray = featuresString;
      }
    } catch (e) {
      featuresArray = [];
    }
    
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      features: featuresArray,
      stripe_price_id: plan.stripe_price_id || '',
      is_free: plan.price === 0
    });
    setShowPlanModal(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setPlanForm({...planForm, features: [...planForm.features, newFeature.trim()]});
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setPlanForm({...planForm, features: planForm.features.filter((_, i) => i !== index)});
  };

  const saveRestrictions = async () => {
    try {
      await api.post('/admin/subscription-restrictions', { restrictions });
      showToast.success('Restrictions updated successfully');
    } catch (error) {
      showToast.error('Failed to update restrictions');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPlanColor = (planName) => {
    switch (planName?.toLowerCase()) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'basic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Total Subscriptions</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSubscriptions.toLocaleString()}</div>
              <div className="text-xs text-blue-600 font-medium">All time</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Active Subscriptions</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeSubscriptions.toLocaleString()}</div>
              <div className="text-xs text-green-600 font-medium">Currently active</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Monthly Revenue</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.monthlyRevenue)}</div>
              <div className="text-xs text-purple-600 font-medium">Recurring revenue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Churn Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.churnRate}%</div>
              <div className="text-xs text-orange-600 font-medium">Monthly churn</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              User Subscriptions ({stats.totalSubscriptions})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'plans'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('restrictions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'restrictions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Feature Restrictions
            </button>
          </div>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Subscriptions</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Subscriptions</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search subscriptions..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={fetchSubscriptions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Loading subscriptions...
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No subscriptions found
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map(subscription => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{subscription.user_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{subscription.user_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(subscription.plan_name)}`}>
                            {subscription.plan_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subscription.status)}`}>
                            {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {subscription.amount > 0 ? formatCurrency(subscription.amount) : 'Free'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              showToast.info(`Subscription Details:\nUser: ${subscription.user_name}\nPlan: ${subscription.plan_name}\nStatus: ${subscription.status}`);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} subscriptions
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setPlanForm({ name: '', price: '', billing_cycle: 'monthly', features: '', stripe_price_id: '' });
                      setShowPlanModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                  >
                    + Add Plan
                  </button>
                  <button
                    onClick={fetchPlans}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading plans...</div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No plans found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map(plan => (
                    <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-gray-500">per {plan.billing_cycle}</div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Active Users:</span>
                          <span className="font-medium">{plan.active_users || 0}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restrictions Tab */}
        {activeTab === 'restrictions' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Feature Restrictions by Plan</h3>
                <button
                  onClick={saveRestrictions}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {['free', 'professional', 'premium'].map(tier => (
                  <div key={tier} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 capitalize">{tier} Plan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Cases</label>
                        <input
                          type="number"
                          value={restrictions[tier].cases}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], cases: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Clients</label>
                        <input
                          type="number"
                          value={restrictions[tier].clients}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], clients: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Documents</label>
                        <input
                          type="number"
                          value={restrictions[tier].documents}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], documents: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Blogs</label>
                        <input
                          type="number"
                          value={restrictions[tier].blogs}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], blogs: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Q&A Answers</label>
                        <input
                          type="number"
                          value={restrictions[tier].qa_answers}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], qa_answers: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Payment Links</label>
                        <input
                          type="number"
                          value={restrictions[tier].payment_links}
                          onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], payment_links: parseInt(e.target.value)}})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="-1 for unlimited"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restrictions[tier].quick_actions}
                            onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], quick_actions: e.target.checked}})}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restrictions[tier].payment_records}
                            onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], payment_records: e.target.checked}})}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Payment Records</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restrictions[tier].calendar}
                            onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], calendar: e.target.checked}})}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Calendar</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restrictions[tier].contacts}
                            onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], contacts: e.target.checked}})}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Contacts</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restrictions[tier].messages}
                            onChange={(e) => setRestrictions({...restrictions, [tier]: {...restrictions[tier], messages: e.target.checked}})}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Messages</span>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Note: Use -1 for unlimited access on numeric fields</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-900">{editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h3>
            
            <div className="space-y-5">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Professional, Premium"
                />
              </div>

              {/* Free Plan Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={planForm.is_free}
                  onChange={(e) => setPlanForm({...planForm, is_free: e.target.checked, price: e.target.checked ? '0' : planForm.price})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_free" className="text-sm font-medium text-gray-700 cursor-pointer">
                  This is a Free Plan (No charge)
                </label>
              </div>

              {/* Price */}
              {!planForm.is_free && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="49.99"
                    />
                  </div>
                </div>
              )}

              {/* Billing Cycle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Cycle *</label>
                <select
                  value={planForm.billing_cycle}
                  onChange={(e) => setPlanForm({...planForm, billing_cycle: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="free">Free (Lifetime)</option>
                </select>
              </div>

              {/* Stripe Price ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stripe Price ID</label>
                <input
                  type="text"
                  value={planForm.stripe_price_id}
                  onChange={(e) => setPlanForm({...planForm, stripe_price_id: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="price_1234567890abcdef"
                />
                <p className="text-xs text-gray-500 mt-1">Get this from your Stripe Dashboard</p>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Features</label>
                
                {/* Feature List */}
                <div className="space-y-2 mb-3">
                  {Array.isArray(planForm.features) && planForm.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg group">
                      <span className="flex-1 text-sm text-gray-700">✓ {feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Feature Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a feature"
                  />
                  <button
                    onClick={addFeature}
                    type="button"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <span className="text-lg">+</span> Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to include a feature</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <button
                onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-sm"
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setEditingPlan(null);
                  setPlanForm({ name: '', price: '', billing_cycle: 'monthly', features: [], stripe_price_id: '', is_free: false });
                  setNewFeature('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
