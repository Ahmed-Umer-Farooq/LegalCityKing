import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Calendar, Plus, Download } from 'lucide-react';

const Accounting = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', category: '', lawyer: '' });
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'expense', description: 'Payment to Ahmad Umer (Lawyer)', amount: 150, date: '2024-12-15', category: 'Lawyer Fees', status: 'Paid', lawyer: 'Ahmad Umer' },
    { id: 2, type: 'expense', description: 'Divorce Filing Fee - Family Court', amount: 435, date: '2024-12-14', category: 'Court Fees' },
    { id: 3, type: 'expense', description: 'Legal Consultation - Family Law', amount: 300, date: '2024-12-12', category: 'Lawyer Fees', status: 'Paid', lawyer: 'John Smith' },
    { id: 4, type: 'expense', description: 'Process Server Fee', amount: 75, date: '2024-12-11', category: 'Legal Services' },
    { id: 5, type: 'expense', description: 'Document Notarization', amount: 25, date: '2024-12-10', category: 'Legal Services' },
    { id: 6, type: 'expense', description: 'Certified Copy of Marriage Certificate', amount: 15, date: '2024-12-09', category: 'Document Fees' },
    { id: 7, type: 'expense', description: 'Mediation Session Fee', amount: 200, date: '2024-12-08', category: 'Legal Services' },
    { id: 8, type: 'expense', description: 'Background Check Fee', amount: 50, date: '2024-12-07', category: 'Investigation' },
    { id: 9, type: 'expense', description: 'Legal Document Preparation', amount: 125, date: '2024-12-06', category: 'Lawyer Fees', status: 'Paid', lawyer: 'Sarah Johnson' },
    { id: 10, type: 'expense', description: 'Court Reporter Fee', amount: 180, date: '2024-12-05', category: 'Court Services' }
  ]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accounting</h1>
          <p className="text-gray-600">Manage your legal finances and track expenses</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: `$${totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500', change: '+12%' },
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'bg-red-500', change: '-5%' },
          { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-500', change: '+18%' },
          { label: 'Pending Invoices', value: '3', icon: FileText, color: 'bg-orange-500', change: '2 overdue' }
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Create Invoice', icon: FileText, color: 'bg-blue-600' },
            { label: 'Record Payment', icon: CreditCard, color: 'bg-green-600' },
            { label: 'Add Expense', icon: TrendingDown, color: 'bg-red-600' },
            { label: 'Generate Report', icon: Download, color: 'bg-purple-600' }
          ].map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button 
                key={index} 
                onClick={() => {
                  if (action.label === 'Create Invoice') setShowInvoiceModal(true);
                  else if (action.label === 'Record Payment') setShowPaymentModal(true);
                  else if (action.label === 'Add Expense') setShowAddModal(true);
                  else if (action.label === 'Generate Report') alert('Generating financial report...');
                }}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => alert('Filter options: All, Lawyer Fees, Court Fees, Other')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Filter
            </button>
            <button 
              onClick={() => alert('Exporting transactions to CSV...')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.map(transaction => (
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
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Income</span>
              <span className="font-semibold text-green-600">+${totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">-${totalExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Spent</span>
                <span className="font-bold text-lg text-red-600">
                  ${totalExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <div className="space-y-3">
            {[
              { category: 'Lawyer Fees', amount: 575, percentage: 38 },
              { category: 'Court Fees', amount: 435, percentage: 29 },
              { category: 'Legal Services', amount: 300, percentage: 20 },
              { category: 'Document & Other Fees', amount: 245, percentage: 13 }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium">${item.amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Consultation fee, court filing, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Lawyer Fees">Lawyer Fees</option>
                  <option value="Court Fees">Court Fees</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Document Fees">Document Fees</option>
                  <option value="Court Services">Court Services</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Retainer">Retainer</option>
                  <option value="Expert Witness">Expert Witness</option>
                  <option value="Travel Expenses">Travel Expenses</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lawyer (Optional)</label>
                <input
                  type="text"
                  value={newTransaction.lawyer}
                  onChange={(e) => setNewTransaction({...newTransaction, lawyer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Lawyer name"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTransaction.description && newTransaction.amount && newTransaction.category) {
                    const transaction = {
                      id: Date.now(),
                      type: 'expense',
                      description: newTransaction.description,
                      amount: parseFloat(newTransaction.amount),
                      date: new Date().toISOString().split('T')[0],
                      category: newTransaction.category,
                      lawyer: newTransaction.lawyer || null
                    };
                    setTransactions([transaction, ...transactions]);
                    setNewTransaction({ description: '', amount: '', category: '', lawyer: '' });
                    setShowAddModal(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Legal consultation, document review, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Invoice created successfully!');
                  setShowInvoiceModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment From</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client or payer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Credit Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Payment notes or reference"
                />
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
                  alert('Payment recorded successfully!');
                  setShowPaymentModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;