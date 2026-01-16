import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';

const PlatformEarnings = () => {
  const [earnings, setEarnings] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    all_time: 0,
    total_payments: 0,
    total_lawyer_earnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/payouts/platform-earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnings(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const platformFeePercentage = earnings.total_payments > 0 
    ? ((earnings.all_time / earnings.total_payments) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-3xl font-bold text-blue-600">${earnings.today.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.today_count || 0} transactions</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-green-600">${earnings.this_week.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.this_week_count || 0} transactions</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-purple-600">${earnings.this_month.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.this_month_count || 0} transactions</p>
            </div>
            <CreditCard className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Time</p>
              <p className="text-3xl font-bold text-indigo-600">${earnings.all_time.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.all_time_count || 0} transactions</p>
            </div>
            <PieChart className="w-12 h-12 text-indigo-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Payments Processed</p>
              <p className="text-xs text-gray-500">All transactions through platform</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">${earnings.total_payments.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Lawyer Earnings (95%)</p>
              <p className="text-xs text-gray-500">Total paid to lawyers</p>
            </div>
            <p className="text-2xl font-bold text-green-600">${earnings.total_lawyer_earnings.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Platform Fees ({platformFeePercentage}%)</p>
              <p className="text-xs text-gray-500">Your commission</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">${earnings.all_time.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Estimated Stripe Fees (~2.9%)</p>
              <p className="text-xs text-gray-500">Payment processing costs</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              ${(earnings.total_payments * 0.029).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Net Platform Profit</p>
              <p className="text-xs text-gray-500">After Stripe fees</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              ${(earnings.all_time - (earnings.total_payments * 0.029)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Transaction</p>
            <p className="text-xl font-bold text-gray-900">
              ${earnings.all_time_count > 0 
                ? (earnings.total_payments / earnings.all_time_count).toFixed(2)
                : '0.00'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Platform Fee</p>
            <p className="text-xl font-bold text-gray-900">
              ${earnings.all_time_count > 0 
                ? (earnings.all_time / earnings.all_time_count).toFixed(2)
                : '0.00'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Daily Average (30 days)</p>
            <p className="text-xl font-bold text-gray-900">
              ${(earnings.this_month / 30).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformEarnings;
