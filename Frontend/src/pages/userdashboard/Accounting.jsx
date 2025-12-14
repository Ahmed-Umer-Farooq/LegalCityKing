import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Calendar, Plus, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api';

const Accounting = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Force refresh on component mount
  useEffect(() => {
    // Clear any cached data
    setTransactions([]);
    fetchTransactions();
  }, []);

  // Fetch user's payment transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view transactions');
        setLoading(false);
        return;
      }

      console.log('Fetching transactions with token:', token.substring(0, 20) + '...');
      
      // Fetch user's transactions from the backend
      const response = await api.get('/user/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Transform backend data to match frontend format
        const transformedTransactions = response.data.data.map(tx => ({
          id: tx.id,
          type: 'expense',
          description: tx.description || `Payment to ${tx.lawyer_name || 'Lawyer'}`,
          amount: parseFloat(tx.amount),
          date: tx.date || tx.created_at,
          category: 'Lawyer Fees',
          status: tx.status === 'completed' ? 'Paid' : tx.status,
          lawyer: tx.lawyer_name
        }));
        
        console.log('Transformed transactions:', transformedTransactions);
        setTransactions(transformedTransactions);
      } else {
        console.error('API returned error:', response.data);
        setError('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error.response?.status === 401) {
        setError('Please log in again');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        setError('Failed to load payment data: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const capturePayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/capture/capture-now', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert(`Captured ${response.data.captured} new payments!`);
        fetchTransactions(); // Refresh the list
      }
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to capture payments');
    }
  };

  const lawyerPayments = transactions.filter(t => t.type === 'expense' && t.category === 'Lawyer Fees');
  const totalPaidToLawyers = lawyerPayments.reduce((sum, t) => sum + t.amount, 0);
  const activeLawyers = [...new Set(lawyerPayments.filter(t => t.lawyer).map(t => t.lawyer))].length;

  const filteredTransactions = filter === 'All' ? transactions : transactions.filter(t => t.category === filter);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Legal City - Transaction Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date and filter info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Filter: ${filter}`, 20, 42);
    doc.text(`Total Records: ${filteredTransactions.length}`, 20, 49);
    
    // Summary stats
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Amount: $${totalAmount.toLocaleString()}`, pageWidth - 20, 42, { align: 'right' });
    
    // Table
    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Description', 'Category', 'Amount', 'Status']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description.length > 40 ? t.description.substring(0, 40) + '...' : t.description,
        t.category,
        `$${t.amount.toLocaleString()}`,
        t.status || 'N/A'
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });
    
    doc.save(`transactions_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lawyer Payments</h1>
        <p className="text-gray-600">Manage payments to your lawyers and track legal expenses</p>
      </div>

      {/* Lawyer Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Total Paid to Lawyers', value: `$${totalPaidToLawyers.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-500', change: 'This month' },
          { label: 'Active Lawyers', value: activeLawyers.toString(), icon: TrendingUp, color: 'bg-green-500', change: 'Working with' }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-500">{stat.change}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>



      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex gap-2">
            <button 
              onClick={fetchTransactions}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Refresh
            </button>
            <button 
              onClick={capturePayments}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Capture Payments
            </button>
          </div>
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <option value="All">All</option>
              <option value="Lawyer Fees">Lawyer Fees</option>
              <option value="Court Fees">Court Fees</option>
              <option value="Legal Services">Legal Services</option>
              <option value="Document Fees">Document Fees</option>
              <option value="Investigation">Investigation</option>
              <option value="Court Services">Court Services</option>
            </select>
            <button 
              onClick={exportToPDF}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchTransactions}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">Your payment history will appear here</p>
            </div>
          ) : (
            filteredTransactions.map(transaction => (
            <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{transaction.category}</span>
                    {transaction.status && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {transaction.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 capitalize">{transaction.type}</p>
              </div>
            </div>
          ))
          )}
        </div>
      </div>





      {/* Pay Lawyer Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Lawyer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lawyer Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter lawyer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Legal consultation, case work, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="card">Credit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Payment to lawyer processed successfully!');
                  setShowPaymentModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Pay Lawyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;