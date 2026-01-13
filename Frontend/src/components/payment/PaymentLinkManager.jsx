import React, { useState, useEffect } from 'react';
import { Plus, Copy, Eye, Edit, Trash2, ExternalLink, Clock, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const PaymentLinkManager = () => {
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    amount: '',
    description: '',
    expires_in_hours: 24,
    client_email: '',
    client_name: ''
  });

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment-links');
      setPaymentLinks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payment links:', error);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/payment-links', formData);
      setPaymentLinks([response.data.data, ...paymentLinks]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Payment link created successfully!');
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error(error.response?.data?.error || 'Failed to create payment link');
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/payment-links/${editingLink.id}`, {
        status: formData.status
      });
      setPaymentLinks(paymentLinks.map(link => 
        link.id === editingLink.id ? response.data.data : link
      ));
      setEditingLink(null);
      resetForm();
      toast.success('Payment link updated successfully!');
    } catch (error) {
      console.error('Error updating payment link:', error);
      toast.error(error.response?.data?.error || 'Failed to update payment link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this payment link?')) {
      return;
    }

    try {
      await api.delete(`/payment-links/${linkId}`);
      setPaymentLinks(paymentLinks.filter(link => link.id !== linkId));
      toast.success('Payment link deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment link:', error);
      toast.error(error.response?.data?.error || 'Failed to delete payment link');
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Payment link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const sendLinkInChat = (link) => {
    const chatMessage = {
      type: 'payment_link',
      service_name: link.service_name,
      amount: link.amount,
      secure_url: `/user/payment/${link.link_id}`,
      description: link.description,
      client_email: link.client_email
    };
    localStorage.setItem('pendingPaymentLink', JSON.stringify(chatMessage));
    toast.success('Payment link ready to send! Go to chat to send it.');
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      amount: '',
      description: '',
      expires_in_hours: 24,
      client_email: '',
      client_name: ''
    });
  };

  const getStatusBadge = (link) => {
    if (link.is_paid) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Paid
      </span>;
    }
    if (link.is_expired) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Expired
      </span>;
    }
    if (link.status === 'disabled') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
        Disabled
      </span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
      Active
    </span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Links</h2>
          <p className="text-gray-600">Create secure payment links to send to clients</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Link
        </button>
      </div>

      {/* Payment Links List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {paymentLinks.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links yet</h3>
            <p className="text-gray-600 mb-4">Create your first payment link to start receiving payments</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Payment Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Expires</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Client</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{link.service_name}</div>
                        {link.description && (
                          <div className="text-sm text-gray-600">{link.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-green-600">${link.amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(link)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {new Date(link.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{link.client_name}</div>
                        <div className="text-xs text-gray-600">{link.client_email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/user/payment/${link.link_id}`)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Copy secure link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendLinkInChat(link)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Send in chat"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        {!link.is_paid && (
                          <>
                            <button
                              onClick={() => {
                                setEditingLink(link);
                                setFormData({ status: link.status });
                              }}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Payment Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Payment Link</h3>
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="e.g., 30-min Consultation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="150.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of the service"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (Hours)
                  </label>
                  <select
                    value={formData.expires_in_hours}
                    onChange={(e) => setFormData({ ...formData, expires_in_hours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>1 Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for secure payment access</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Payment Link</h3>
              <form onSubmit={handleUpdateLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLink(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentLinkManager;