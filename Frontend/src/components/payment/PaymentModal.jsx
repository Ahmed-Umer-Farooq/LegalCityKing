import React, { useState } from 'react';
import { X, Shield, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const PaymentModal = ({ isOpen, onClose, lawyer, user }) => {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(lawyer?.consultation_rate || 150);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentType, setPaymentType] = useState('consultation');

  const predefinedAmounts = [
    { label: '30-min Consultation', amount: lawyer?.consultation_rate || 150, type: 'consultation' },
    { label: '1 Hour Session', amount: lawyer?.hourly_rate || 300, type: 'hourly' },
    { label: 'Document Review', amount: 200, type: 'document_review' },
    { label: 'Custom Amount', amount: 'custom', type: 'custom' }
  ];

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to make a payment');
      return;
    }

    setLoading(true);
    try {
      const amount = paymentType === 'custom' ? parseFloat(customAmount) : selectedAmount;
      
      if (!amount || amount < 10) {
        toast.error('Minimum payment amount is $10');
        setLoading(false);
        return;
      }

      const response = await api.post('/stripe/create-consultation-checkout', {
        amount,
        lawyerId: lawyer.id,
        userId: user.id,
        description: `${paymentType === 'consultation' ? 'Legal Consultation' : 
                     paymentType === 'hourly' ? 'Hourly Legal Service' : 
                     paymentType === 'document_review' ? 'Document Review' : 'Legal Service'} - ${lawyer.name}`
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Secure Payment</h2>
              <p className="text-blue-100 text-sm">Pay {lawyer?.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Security Badges */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-center gap-4 text-xs text-[#374151]">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-[#10b981]" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#10b981]" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-[#10b981]" />
              <span>Stripe Secure</span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#374151] mb-4">Select Service</h3>
          <div className="space-y-3">
            {predefinedAmounts.map((option, index) => (
              <div key={index} className="relative">
                <input
                  type="radio"
                  id={`amount-${index}`}
                  name="amount"
                  checked={paymentType === option.type && (option.amount !== 'custom' ? selectedAmount === option.amount : true)}
                  onChange={() => {
                    setPaymentType(option.type);
                    if (option.amount !== 'custom') {
                      setSelectedAmount(option.amount);
                    }
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor={`amount-${index}`}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentType === option.type && (option.amount !== 'custom' ? selectedAmount === option.amount : true)
                      ? 'border-[#1e3a8a] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#374151]">{option.label}</div>
                      {option.type === 'consultation' && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Initial consultation
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-[#1e3a8a]">
                      {option.amount === 'custom' ? 'Custom' : `$${option.amount}`}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Custom Amount Input */}
          {paymentType === 'custom' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#374151] font-medium">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  min="10"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1e3a8a] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum amount: $10.00</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#374151]">Service Amount</span>
              <span className="font-semibold">${paymentType === 'custom' ? customAmount || '0.00' : selectedAmount}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#374151]">Processing Fee</span>
              <span className="text-sm text-gray-500">Included</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold text-[#374151]">Total</span>
              <span className="text-xl font-bold text-[#1e3a8a]">
                ${paymentType === 'custom' ? customAmount || '0.00' : selectedAmount}
              </span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading || (paymentType === 'custom' && !customAmount)}
            className="w-full mt-6 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white py-4 rounded-lg font-semibold hover:from-[#1e40af] hover:to-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
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
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;