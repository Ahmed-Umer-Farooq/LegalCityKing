import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Filter, Calendar, User, CheckCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const PaymentRecords = () => {
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState({
    total_earned: 0,
    available_balance: 0,
    pending_balance: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    period: 'all',
    status: 'all'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentRecords();
  }, [filters]);

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stripe/lawyer-earnings');
      
      setEarnings(response.data.earnings || {});
      let transactions = response.data.recentTransactions || [];
      
      // Apply client-side filtering
      if (filters.period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (filters.period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        if (startDate) {
          transactions = transactions.filter(t => new Date(t.created_at) >= startDate);
        }
      }
      
      // Apply status filter (all transactions from stripe are completed)
      if (filters.status === 'acknowledged') {
        transactions = transactions.filter(t => t.acknowledged);
      } else if (filters.status === 'unacknowledged') {
        transactions = transactions.filter(t => !t.acknowledged);
      }
      
      setPayments(transactions);
      setPagination(prev => ({
        ...prev,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / prev.limit)
      }));
    } catch (error) {
      console.error('Error fetching payment records:', error);
      toast.error('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Create CSV from current data
      const csvHeader = 'Date,Service,Amount,Platform Fee,Net Earnings,Status\n';
      const csvRows = payments.map(payment => {
        const date = new Date(payment.created_at).toLocaleDateString();
        const acknowledged = payment.acknowledged ? 'Acknowledged' : 'Pending';
        return `${date},"${payment.description || 'Legal Service'}",${payment.amount || 0},${payment.platform_fee || 0},${payment.lawyer_earnings || 0},${acknowledged}`;
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-records-${filters.period}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Payment records exported successfully');
    } catch (error) {
      console.error('Error exporting payment records:', error);
      toast.error('Failed to export payment records');
    }
  };

  const acknowledgePayment = async (transactionId) => {
    try {
      await api.post(`/payment-acknowledgment/acknowledge/${transactionId}`);
      toast.success('Payment acknowledged successfully');
      fetchPaymentRecords(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging payment:', error);
      toast.error('Failed to acknowledge payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary from current data
  const summary = {
    totalPayments: payments.length,
    totalReceived: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    totalFees: payments.reduce((sum, p) => sum + (parseFloat(p.platform_fee) || 0), 0),
    totalEarnings: payments.reduce((sum, p) => sum + (parseFloat(p.lawyer_earnings) || 0), 0),
    unacknowledgedCount: payments.filter(p => !p.acknowledged).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Records</h1>
          <p className="text-gray-600">Track all payments received from clients</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalReceived)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Earnings</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalEarnings)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-xl font-bold text-gray-900">{summary.totalPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Acknowledgment</p>
              <p className="text-xl font-bold text-gray-900">{summary.unacknowledgedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="border rounded-lg px-3 py-2"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Payments</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="unacknowledged">Pending Acknowledgment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments
                  .slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
                  .map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.user_name || 'Client'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.user_email || 'No email available'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.description || 'Legal Service Payment'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payment.lawyer_earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.acknowledged ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!payment.acknowledged && (
                        <button
                          onClick={() => acknowledgePayment(payment.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payments.length > pagination.limit && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, payments.length)}
                  </span>{' '}
                  of <span className="font-medium">{payments.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRecords;