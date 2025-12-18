import React, { useState, useEffect } from 'react';
import { Share2, Copy, Mail, MessageCircle, Users, Gift, DollarSign } from 'lucide-react';
import api from '../../api';

const Refer = () => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await api.get('/referral/data');
      setReferralData(response.data.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      // Fallback to static data if API fails
      setReferralData({
        referral_code: 'LOADING...',
        referral_link: '',
        stats: { total_referrals: 0, completed_referrals: 0, pending_referrals: 0, total_earnings: 0 },
        referrals: []
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    if (referralData?.referral_link) {
      navigator.clipboard.writeText(referralData.referral_link);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
        <p className="text-gray-600">Invite friends and earn rewards for every successful referral</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: referralData?.stats?.total_referrals || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Completed', value: referralData?.stats?.completed_referrals || 0, icon: Gift, color: 'bg-green-500' },
          { label: 'Pending', value: referralData?.stats?.pending_referrals || 0, icon: MessageCircle, color: 'bg-yellow-500' },
          { label: 'Total Earned', value: `$${referralData?.stats?.total_earnings || 0}`, icon: DollarSign, color: 'bg-purple-500' }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Referral Program */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">1. Share Your Link</h3>
              <p className="text-sm opacity-90">Send your unique referral link to friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">2. They Sign Up</h3>
              <p className="text-sm opacity-90">Your friends register using your link</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
              <p className="text-sm opacity-90">Get $10 for each successful referral</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code & Sharing */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
              <p className="text-2xl font-bold text-blue-600 tracking-wider">{referralData?.referral_code || 'Loading...'}</p>
            </div>
          </div>
          <button
            onClick={copyReferralCode}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={shareReferralLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail className="w-4 h-4" />
            Email Invite
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4" />
            SMS Invite
          </button>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Referral History</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {referralData?.referrals?.length > 0 ? (
            referralData.referrals.map(referral => (
              <div key={referral.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{referral.referee_name || referral.referee_email || 'Anonymous'}</h4>
                    <p className="text-sm text-gray-500">Referred on {new Date(referral.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    referral.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  <span className="font-semibold text-gray-900">${referral.reward_amount}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No referrals yet</p>
              <p className="text-sm">Start sharing your referral code to earn rewards!</p>
            </div>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Earn $10 for each successful referral who makes their first payment</li>
          <li>• Referral must use your unique code during signup</li>
          <li>• Rewards are processed within 7 business days</li>
          <li>• Self-referrals and duplicate accounts are not eligible</li>
        </ul>
      </div>
    </div>
  );
};

export default Refer;