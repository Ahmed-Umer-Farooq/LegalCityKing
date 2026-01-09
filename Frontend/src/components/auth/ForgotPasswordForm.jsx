import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../utils/api';
import OtpInput from '../OtpInput';

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    } else if (name === 'newPassword') {
      setNewPassword(value);
      if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const handleOtpChange = (otpValue) => {
    setOtp(otpValue);
    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
  };

  const validateEmailForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/\d/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (validateEmailForm()) {
      setLoading(true);
      try {
        await api.post('/auth/forgot-password-otp', { email });
        toast.success('Password reset OTP sent to your email!');
        setShowOtpForm(true);
        setCountdown(60); // 60 second countdown
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (validateResetForm()) {
      setLoading(true);
      try {
        await api.post('/auth/verify-forgot-password-otp', {
          email,
          otp,
          newPassword
        });
        toast.success('Password reset successfully!');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } catch (error) {
        setErrors({ otp: error.response?.data?.message || 'Failed to reset password' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await api.post('/auth/forgot-password-otp', { email });
      toast.success('OTP sent to your email!');
      setCountdown(60);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!showOtpForm) {
        handleSendOTP();
      } else {
        handleResetPassword();
      }
    }
  };

  if (showOtpForm) {
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Reset Password</h2>
          <p className="text-gray-600">
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4 text-center">OTP Code</label>
            <OtpInput
              length={6}
              onChange={handleOtpChange}
              error={!!errors.otp}
              disabled={loading}
            />
            {errors.otp && <p className="text-red-500 text-xs mt-2 text-center">{errors.otp}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter new password (min 6 chars, 1 number)"
              className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
            />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3.5 bg-[#0891B2] hover:bg-[#0284C7] disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors text-base shadow-md mt-6"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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
  }

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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Forgot Password?</h2>
        <p className="text-gray-600">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your email"
            className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSendOTP}
          disabled={loading}
          className="w-full py-3.5 bg-[#0891B2] hover:bg-[#0284C7] disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors text-base shadow-md mt-6"
        >
          {loading ? 'Sending...' : 'Send Reset OTP'}
        </button>

        {/* Back to Login Link */}
        <div className="text-center">
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

export default ForgotPasswordForm;
