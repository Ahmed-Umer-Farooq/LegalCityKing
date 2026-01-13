import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Clock, CheckCircle, User, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SecurePaymentPage = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentLink, setPaymentLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Block lawyers from accessing payment links
    if (user.role === 'lawyer') {
      setError('Lawyers cannot access payment links. This page is for clients only.');
      setLoading(false);
      return;
    }
    
    fetchPaymentLink();
  }, [linkId, user]);

  const fetchPaymentLink = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payment-links/${linkId}`);
      const link = response.data.data;
      
      // Verify user has access to this payment link
      if (link.client_email && user.email !== link.client_email) {
        setError('This payment link is not for your account');
        return;
      }
      
      setPaymentLink(link);
    } catch (error) {
      console.error('Error fetching payment link:', error);
      setError(error.response?.data?.error || 'Payment link not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/stripe/create-payment-link-checkout', {
        linkId,
        userId: user.id
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              if (user.role === 'lawyer') {
                navigate('/lawyer-dashboard');
              } else {
                navigate('/user-dashboard');
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-xl font-bold">Secure Payment</h1>
            <p className="text-blue-100">Pay {paymentLink?.lawyer_name}</p>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <DollarSign className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full p-4 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">{paymentLink?.service_name}</h2>
              {paymentLink?.description && (
                <p className="text-gray-600 text-sm mt-2">{paymentLink.description}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Provider</span>
                <span className="font-medium">{paymentLink?.lawyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-green-600">${paymentLink?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires</span>
                <span className="text-sm">
                  {new Date(paymentLink?.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Pay Securely
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              Secured by Stripe. Your payment information is encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurePaymentPage;