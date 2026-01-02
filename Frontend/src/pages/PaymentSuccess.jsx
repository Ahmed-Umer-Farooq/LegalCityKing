import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirect = async () => {
    // Update subscription status if this is a subscription payment
    if (sessionId && user?.role === 'lawyer') {
      try {
        await api.post('/stripe/update-subscription-status', { sessionId });
        toast.success('Subscription activated successfully!');
      } catch (error) {
        console.error('Error updating subscription:', error);
      }
    }
    
    if (user?.role === 'lawyer') {
      navigate('/lawyer-dashboard/subscription');
    } else {
      navigate('/user-dashboard');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!sessionId) {
      toast.error('No session ID available');
      return;
    }

    try {
      const response = await api.get(`/stripe/receipt?session_id=${sessionId}`);
      const receiptData = response.data;
      
      // Create a formatted receipt content
      const receiptContent = `
        PAYMENT RECEIPT
        ================
        
        Transaction ID: ${receiptData.sessionId}
        Payment Intent: ${receiptData.paymentIntentId}
        Amount: $${receiptData.amount} ${receiptData.currency}
        Status: ${receiptData.status}
        Date: ${new Date(receiptData.created).toLocaleDateString()}
        Description: ${receiptData.description}
        
        Customer Information:
        Name: ${receiptData.customerName || 'N/A'}
        Email: ${receiptData.customerEmail || 'N/A'}
        
        Thank you for your payment!
      `;
      
      // Create and download the receipt as a text file
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-[#374151] mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>

        {/* Session Info */}
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Transaction ID:</p>
            <p className="text-xs font-mono text-[#374151] break-all">{sessionId}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleRedirect}
            className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          <button 
            onClick={handleDownloadReceipt}
            disabled={!sessionId}
            className="w-full border border-gray-300 text-[#374151] py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        {/* Auto Redirect Notice */}
        <div className="text-sm text-gray-500">
          <p>Redirecting to dashboard in {countdown} seconds...</p>
          <button 
            onClick={handleRedirect}
            className="text-[#1e3a8a] hover:text-[#1e40af] font-medium inline-flex items-center gap-1 mt-2"
          >
            Go now <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-[#374151]">
            🔒 Your payment was processed securely through Stripe. 
            We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;