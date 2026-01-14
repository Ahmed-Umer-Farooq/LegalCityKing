import React, { useState, useEffect } from 'react';
import { Crown, Star, CreditCard, Calendar, TrendingUp, Shield, Home, FileText, Users, DollarSign, Check, Zap, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [stats, setStats] = useState({ 
    activeCases: 0, 
    totalClients: 0, 
    monthlyRevenue: 0, 
    upcomingHearings: 0
  });
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchLawyerData();
    fetchSubscriptionStatus();
    fetchEarnings();
    fetchDashboardStats();
    fetchSubscriptionPlans();
    
    // Check for subscription success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (urlParams.get('success') === 'true' || sessionId) {
      handleSubscriptionSuccess(sessionId);
    }
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/stripe/subscription-status');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const fetchLawyerData = async () => {
    try {
      const response = await api.get('/lawyer/profile');
      if (response.data) {
        setLawyer(response.data);
      } else {
        // Fallback to localStorage if API returns null
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && storedUser.id) {
          setLawyer(storedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching lawyer data:', error);
      // Try localStorage as fallback
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser && storedUser.id) {
        setLawyer(storedUser);
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManagePaymentMethods = async () => {
    try {
      const response = await api.post('/stripe/create-billing-portal-session');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating customer portal:', error);
      toast.error('Failed to open payment management');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your current billing period.')) {
      return;
    }
    
    try {
      const response = await api.post('/stripe/cancel-subscription');
      if (response.data?.success) {
        toast.success('Subscription cancelled successfully. You will keep access until expiry.');
        await fetchSubscriptionStatus();
        await fetchLawyerData();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleUpgrade = async (planType) => {
    try {
      const plan = subscriptionPlans.find(p => 
        p.name.toLowerCase() === planType && 
        p.billing_cycle === billingCycle
      );
      
      if (!plan || !plan.stripe_price_id) {
        throw new Error(`No price ID found for ${planType} ${billingCycle} plan`);
      }
      
      console.log(`🚀 Upgrading to ${planType} (${billingCycle}) with price ID: ${plan.stripe_price_id}`);
      
      const response = await api.post('/stripe/create-subscription-checkout', {
        priceId: plan.stripe_price_id
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(`Subscription error: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/stripe/lawyer-earnings');
      setEarnings(response.data.earnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setEarnings({
        total_earned: '0.00',
        available_balance: '0.00',
        pending_balance: '0.00',
        recentTransactions: []
      });
    }
  };

  const handleSubscriptionSuccess = async (sessionId) => {
    try {
      console.log('🔄 Processing subscription success with sessionId:', sessionId);
      
      // Update subscription status manually
      if (sessionId) {
        console.log('📡 Calling update-subscription-status API...');
        const updateResponse = await api.post('/stripe/update-subscription-status', { sessionId });
        console.log('✅ Update response:', updateResponse.data);
      }
      
      toast.success('Subscription activated successfully!');
      
      // Refresh user data immediately
      console.log('🔄 Refreshing lawyer data...');
      await fetchLawyerData();
      await fetchSubscriptionStatus();
      console.log('✅ Lawyer data refreshed, new tier:', lawyer?.subscription_tier);
      
      // Clean URL without redirecting
      window.history.replaceState({}, document.title, '/lawyer-dashboard/subscription');
    } catch (error) {
      console.error('❌ Error handling subscription success:', error);
      toast.error('Subscription activated but there was an issue updating your account. Please refresh the page.');
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await api.get('/stripe/subscription-plans');
      setSubscriptionPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/lawyer/dashboard/stats');
      setStats(response.data || { 
        activeCases: 0, 
        totalClients: 0, 
        monthlyRevenue: 0, 
        upcomingHearings: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/lawyer-dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-white/50 rounded-lg transition-colors backdrop-blur-sm"
            >
              <Home className="w-4 h-4" />
              Dashboard Home
            </button>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">Subscription Management</h1>
          <p className="text-slate-600 text-lg">Manage your subscription and view earnings</p>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Current Plan</h3>
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="mb-4">
              {lawyer?.subscription_tier === 'premium' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                  <Crown className="w-4 h-4" />
                  <span className="font-semibold">Premium</span>
                </div>
              ) : lawyer?.subscription_tier === 'professional' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">Professional</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full">
                  <span className="font-semibold">Free</span>
                </div>
              )}
            </div>
            
            {/* Cancellation Status */}
            {subscriptionStatus?.cancelled && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold text-sm">Subscription Cancelled</span>
                </div>
                <p className="text-xs text-amber-600">
                  {subscriptionStatus.days_until_expiry > 0 
                    ? `${subscriptionStatus.days_until_expiry} days remaining`
                    : 'Expired'
                  }
                </p>
                {subscriptionStatus.expires_at && (
                  <p className="text-xs text-amber-600">
                    Expires: {new Date(subscriptionStatus.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            
            <p className="text-sm text-slate-600">
              {lawyer?.subscription_tier === 'free' || !lawyer?.subscription_tier
                ? 'Upgrade to unlock premium features'
                : subscriptionStatus?.cancelled
                  ? 'Will downgrade to Free after expiry'
                  : `Active since ${new Date(lawyer?.subscription_created_at).toLocaleDateString()}`
              }
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Total Earnings</h3>
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
              ${earnings?.total_earned || '0.00'}
            </div>
            <p className="text-sm text-slate-600">
              Available: ${earnings?.available_balance || '0.00'}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Payment Method</h3>
              <CreditCard className="w-6 h-6 text-slate-600" />
            </div>
            <div className="text-sm text-slate-600 mb-4">
              {lawyer?.stripe_customer_id ? 'Card on file' : 'No payment method'}
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleManagePaymentMethods}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline block"
              >
                Manage Payment Methods
              </button>
              {(lawyer?.subscription_tier === 'premium' || lawyer?.subscription_tier === 'professional') && !subscriptionStatus?.cancelled && (
                <button 
                  onClick={handleCancelSubscription}
                  className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline block"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-3">Subscription Plans</h2>
            <p className="text-slate-600 text-lg">Choose a plan that fits your needs</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                  15% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Professional Plan */}
            <div className="relative bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 hover:shadow-3xl transition-all duration-300 flex flex-col h-full">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-slate-800 mb-4">Professional</h3>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  ${billingCycle === 'monthly' 
                    ? (subscriptionPlans.find(p => p.name === 'Professional' && p.billing_cycle === 'monthly')?.price || '49.00')
                    : (subscriptionPlans.find(p => p.name === 'Professional' && p.billing_cycle === 'yearly')?.price * 12 || '499.80').toFixed(0)
                  }
                  <span className="text-xl text-slate-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full inline-block">Save $88 annually (15% off)</p>
                )}
              </div>
              
              <ul className="space-y-5 mb-8 flex-grow">
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800 font-medium">Enhanced profile management</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800 font-medium">Unlimited client messaging</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800 font-medium">Blog management system</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800 font-medium">Advanced reports & analytics</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800 font-medium">Email support</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleUpgrade('professional')}
                disabled={lawyer?.subscription_tier === 'professional' || lawyer?.subscription_tier === 'premium'}
                className={`w-full font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl mt-auto ${
                  lawyer?.subscription_tier === 'professional'
                    ? 'bg-emerald-500 text-white cursor-not-allowed'
                    : lawyer?.subscription_tier === 'premium'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                {lawyer?.subscription_tier === 'professional' 
                  ? 'Current Plan' 
                  : lawyer?.subscription_tier === 'premium'
                  ? 'Included in Premium'
                  : 'Get Professional'
                }
              </button>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 text-slate-800 hover:shadow-3xl transition-all duration-300 flex flex-col h-full">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-8 mt-4">
                <h3 className="text-3xl font-bold mb-4">Premium</h3>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  ${billingCycle === 'monthly' 
                    ? (subscriptionPlans.find(p => p.name === 'Premium' && p.billing_cycle === 'monthly')?.price || '99.00')
                    : (subscriptionPlans.find(p => p.name === 'Premium' && p.billing_cycle === 'yearly')?.price * 12 || '1009.80').toFixed(0)
                  }
                  <span className="text-xl text-slate-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full inline-block">Save $178 annually (15% off)</p>
                )}
              </div>
              
              <ul className="space-y-5 mb-8 flex-grow">
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">All Professional features</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Q&A answer management</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Verification badge system</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Forms management system</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Client management tools</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Priority phone support</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleUpgrade('premium')}
                disabled={lawyer?.subscription_tier === 'premium'}
                className={`w-full font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl mt-auto ${
                  lawyer?.subscription_tier === 'premium'
                    ? 'bg-emerald-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                }`}
              >
                {lawyer?.subscription_tier === 'premium' ? 'Current Plan' : 'Get Premium'}
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex justify-center items-center gap-8 mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Instant Activation</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {earnings?.recentTransactions && earnings.recentTransactions.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800 capitalize font-medium">
                        {transaction.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-emerald-600">
                        ${transaction.lawyer_earnings}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;