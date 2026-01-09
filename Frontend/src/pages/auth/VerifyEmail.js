import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../utils/api';
import OtpInput from '../../components/OtpInput';

const VerifyEmail = ({ email, onVerified, onSwitchToLogin }) => {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (otpValue) => {
    setCode(otpValue);
    if (errors.code) setErrors({});
  };

  const handleOtpComplete = (otpValue) => {
    setCode(otpValue);
    if (errors.code) setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!code.trim()) {
      newErrors.code = 'Verification code is required';
    } else if (code.length !== 6) {
      newErrors.code = 'Code must be 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        await api.post('/auth/verify-email', { email, code });
        toast.success('Email verified successfully! You can now log in.');
        setTimeout(() => {
          onVerified();
        }, 2000);
      } catch (error) {
        setErrors({ code: error.response?.data?.message || 'Invalid verification code' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email!');
      setCountdown(60); // 60 second countdown
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setResendLoading(false);
    }
  };



  return (
    <div className="w-full">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-[#0284C7] rounded-full px-6 py-3 shadow-lg inline-flex">
            <span className="text-white font-bold text-3xl">Legal</span>
          </div>
          <span className="text-[#0284C7] font-bold text-3xl">City</span>
        </div>
        <p className="text-[#0284C7] text-sm font-semibold tracking-wider uppercase">
          " Legal for the people "
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Email</h2>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>

        {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4 text-center">Verification Code</label>
          <OtpInput
            length={6}
            onChange={handleOtpChange}
            onComplete={handleOtpComplete}
            error={!!errors.code}
            disabled={loading}
          />
          {errors.code && <p className="text-red-500 text-xs mt-2 text-center">{errors.code}</p>}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-[#0891B2] hover:bg-[#0284C7] disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors text-base shadow-md mt-6"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        {/* Resend OTP */}
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || countdown > 0}
            className="text-[#0284C7] font-semibold hover:underline text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>

        {/* Back to Login Link */}
        <div className="text-center mt-4">
          <button
            onClick={onSwitchToLogin}
            type="button"
            className="text-[#0284C7] font-semibold hover:underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;