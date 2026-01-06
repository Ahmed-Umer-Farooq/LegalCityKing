import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const PaymentAcknowledgment = ({ onAcknowledged }) => {
  const [unacknowledgedPayments, setUnacknowledgedPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnacknowledgedPayments();
  }, []);

  const fetchUnacknowledgedPayments = async () => {
    try {
      const response = await api.get('/payment-acknowledgment/unacknowledged');
      setUnacknowledgedPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching unacknowledged payments:', error);
    }
  };

  const acknowledgePayment = async (transactionId) => {
    try {
      setLoading(true);
      await api.post(`/payment-acknowledgment/acknowledge/${transactionId}`);
      
      // Remove from unacknowledged list
      setUnacknowledgedPayments(prev => 
        prev.filter(payment => payment.id !== transactionId)
      );
      
      toast.success('Payment acknowledged successfully');
      
      if (onAcknowledged) {
        onAcknowledged();
      }
      
    } catch (error) {
      console.error('Error acknowledging payment:', error);
      toast.error('Failed to acknowledge payment');
    } finally {
      setLoading(false);
    }
  };

  if (unacknowledgedPayments.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {unacknowledgedPayments.map((payment) => (
        <div key={payment.id} className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 mb-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">New Payment Received!</h4>
                <p className="text-sm text-gray-600">{payment.description}</p>
                <p className="text-sm text-gray-500">
                  ${Number(payment.amount).toFixed(2)} from {payment.user_name || 'Client'}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(payment.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => acknowledgePayment(payment.id)}
              disabled={loading}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              Acknowledge Payment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentAcknowledgment;