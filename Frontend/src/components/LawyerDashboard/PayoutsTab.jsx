import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, CreditCard, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PayoutsTab = () => {
  const [balance, setBalance] = useState({ available: 0, pending: 0, total_earned: 0 });
  const [accountStatus, setAccountStatus] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [balanceRes, statusRes, payoutsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/stripe-connect/balance', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5001/api/stripe-connect/account-status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5001/api/stripe-connect/payout-history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setBalance(balanceRes.data);
      setAccountStatus(statusRes.data);
      setPayouts(payoutsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      const createRes = await axios.post(
        'http://localhost:5001/api/stripe-connect/create-account',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (createRes.data.success) {
        const linkRes = await axios.get(
          'http://localhost:5001/api/stripe-connect/onboarding-link',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (linkRes.data.url) {
          if (linkRes.data.url.includes('mock_onboarding')) {
            await axios.post(
              'http://localhost:5001/api/stripe-connect/complete-onboarding',
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Bank account connected successfully! (TEST MODE)');
            fetchData();
          } else {
            window.location.href = linkRes.data.url;
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect account');
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const amount = parseFloat(payoutAmount);
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount > balance.available) {
        setError('Insufficient balance');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5001/api/stripe-connect/request-payout',
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess(res.data.message);
        setPayoutAmount('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request payout');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Processing' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">${balance.available.toFixed(2)}</p>
            </div>
            <Wallet className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">${balance.pending.toFixed(2)}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-3xl font-bold text-blue-600">${balance.total_earned.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {!accountStatus?.connected ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <CreditCard className="w-6 h-6 text-blue-600 mt-1 mr-3" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Bank Account</h3>
              <p className="text-gray-600 mb-4">
                Connect your bank account to receive payments directly. Secure, encrypted, takes just a few minutes.
              </p>
              <button
                onClick={handleConnectAccount}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Connect Bank Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1 mr-3" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Account Connected</h3>
              <p className="text-gray-600">
                Bank: **** **** {accountStatus.bank_last4 || '1234'} • Status: Active
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {accountStatus?.connected && accountStatus?.payouts_enabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Payout</h3>
          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (Available: ${balance.available.toFixed(2)})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={balance.available}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum: $50.00 • Arrives in 2-7 business days</p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Request Payout
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No payouts yet
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.stripe_payout_id || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutsTab;
