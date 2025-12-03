import React, { useState, useEffect } from 'react';
import { Check, Crown, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const SubscriptionPlans = ({ lawyer, onSubscribe }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/stripe/subscription-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const handleSubscribe = async (priceId) => {
    setLoading(true);
    try {
      const response = await api.post('/stripe/create-subscription-checkout', {
        priceId
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.error || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter(plan => plan.billing_period === billingPeriod);
  const professionalPlan = filteredPlans.find(p => p.name === 'Professional');
  const premiumPlan = filteredPlans.find(p => p.name === 'Premium');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#374151] mb-4">Choose Your Plan</h2>
        <p className="text-lg text-gray-600 mb-6">Upgrade your legal practice with professional tools</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-[#1e3a8a] shadow-sm'
                : 'text-gray-600 hover:text-[#1e3a8a]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-md font-medium transition-all relative ${
              billingPeriod === 'yearly'
                ? 'bg-white text-[#1e3a8a] shadow-sm'
                : 'text-gray-600 hover:text-[#1e3a8a]'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-[#10b981] text-white text-xs px-2 py-1 rounded-full">
              15% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Current Plan Status */}
      {lawyer?.subscription_tier && lawyer.subscription_tier !== 'free' && (
        <div className="mb-6 p-4 bg-[#10b981] bg-opacity-10 border border-[#10b981] rounded-lg">
          <div className="flex items-center gap-2 text-[#10b981]">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              Current Plan: {lawyer.subscription_tier.charAt(0).toUpperCase() + lawyer.subscription_tier.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Professional Plan */}
        {professionalPlan && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#1e3a8a] transition-all duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Star className="w-8 h-8 text-[#1e3a8a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#374151] mb-2">Professional</h3>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">
                ${professionalPlan.price}
                <span className="text-lg text-gray-500 font-normal">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-[#10b981] font-medium">Save $89/year</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {JSON.parse(professionalPlan.features || '[]').map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#374151]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(professionalPlan.stripe_price_id)}
              disabled={loading || lawyer?.subscription_tier === 'professional'}
              className="w-full bg-[#1e3a8a] text-white py-4 rounded-lg font-semibold hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {lawyer?.subscription_tier === 'professional' ? 'Current Plan' : 
               loading ? 'Processing...' : 'Get Professional'}
            </button>
          </div>
        )}

        {/* Premium Plan */}
        {premiumPlan && (
          <div className="bg-white border-2 border-[#1e3a8a] rounded-2xl p-8 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-2 text-sm font-semibold">
              Most Popular
            </div>

            <div className="text-center mb-6 mt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-full mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#374151] mb-2">Premium</h3>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">
                ${premiumPlan.price}
                <span className="text-lg text-gray-500 font-normal">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-[#10b981] font-medium">Save $189/year</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {JSON.parse(premiumPlan.features || '[]').map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#374151]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(premiumPlan.stripe_price_id)}
              disabled={loading || lawyer?.subscription_tier === 'premium'}
              className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white py-4 rounded-lg font-semibold hover:from-[#1e40af] hover:to-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {lawyer?.subscription_tier === 'premium' ? 'Current Plan' : 
               loading ? 'Processing...' : 'Get Premium'}
            </button>
          </div>
        )}
      </div>

      {/* Security Footer */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-6 text-sm text-[#374151]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#10b981]" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10b981]" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#10b981]" />
            <span>Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;