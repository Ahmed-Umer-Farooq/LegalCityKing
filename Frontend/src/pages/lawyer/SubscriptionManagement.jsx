import React, { useState, useEffect } from 'react';
import { Crown, Star, CreditCard, Calendar, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SubscriptionPlans from '../../components/payment/SubscriptionPlans';
import { toast } from 'sonner';
import api from '../../utils/api';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [lawyer, setLawyer] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyerData();
    fetchEarnings();
  }, []);

  const fetchLawyerData = async () => {
    try {
      const response = await api.get('/lawyer/profile');
      setLawyer(response.data);
    } catch (error) {
      console.error('Error fetching lawyer data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post('/stripe/create-billing-portal-session');
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      toast.error('Failed to open billing portal');
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/stripe/lawyer-earnings');
      setEarnings(response.data.earnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Fallback earnings data
      setEarnings({
        total_earned: '0.00',
        available_balance: '0.00',
        pending_balance: '0.00',
        recentTransactions: []
      });
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'premium':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-full">
            <Crown className="w-4 h-4" />
            <span className="font-semibold">Premium</span>
          </div>
        );
      case 'professional':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-[#1e3a8a] rounded-full">
            <Star className="w-4 h-4" />
            <span className="font-semibold">Professional</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
            <span className="font-semibold">Free</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#374151]">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#374151] mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your subscription and view earnings</p>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#374151]">Current Plan</h3>
              <Shield className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="mb-4">
              {getTierBadge(lawyer?.subscription_tier)}
            </div>
            <p className="text-sm text-gray-600">
              {lawyer?.subscription_tier === 'free' 
                ? 'Upgrade to unlock premium features'
                : `Active since ${new Date(lawyer?.subscription_created_at).toLocaleDateString()}`
              }
            </p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#374151]">Total Earnings</h3>
              <TrendingUp className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="text-3xl font-bold text-[#1e3a8a] mb-2">
              ${earnings?.total_earned || '0.00'}
            </div>
            <p className="text-sm text-gray-600">
              Available: ${earnings?.available_balance || '0.00'}
            </p>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#374151]">Payment Method</h3>
              <CreditCard className="w-6 h-6 text-[#374151]" />
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {lawyer?.stripe_customer_id ? 'Card on file' : 'No payment method'}
            </div>
            <button 
              onClick={handleManageSubscription}
              className="text-[#1e3a8a] hover:text-[#1e40af] font-medium text-sm"
            >
              Manage Payment Methods
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {(!lawyer?.subscription_tier || lawyer?.subscription_tier === 'free' || lawyer?.subscription_tier === 'professional') ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#374151] mb-2">Upgrade Your Practice</h2>
              <p className="text-gray-600">Choose a plan that fits your needs</p>
            </div>
            <SubscriptionPlans lawyer={lawyer} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#374151] mb-4">Subscription Active</h2>
              <p className="text-gray-600 mb-6">
                You're currently on the {lawyer?.subscription_tier?.charAt(0).toUpperCase() + lawyer?.subscription_tier?.slice(1) || 'Professional'} plan
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleManageSubscription}
                  className="px-6 py-3 border border-gray-300 text-[#374151] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {earnings?.recentTransactions && earnings.recentTransactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#374151] mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-[#374151]">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-[#374151]">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-[#374151]">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-[#374151]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#374151] capitalize">
                        {transaction.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-[#10b981]">
                        ${transaction.lawyer_earnings}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-[#10b981] bg-opacity-10 text-[#10b981]'
                            : 'bg-yellow-100 text-yellow-800'
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