import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../utils/api';

const ResetPassword = ({ onResetSuccess }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'Invalid reset link' });
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6 || !/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 6 characters and include a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        await api.post('/auth/reset-password', {
          token,
          newPassword: formData.newPassword,
        });
        toast.success('Password reset successfully! You can now log in with your new password.');
        onResetSuccess();
      } catch (error) {
        setErrors({ general: error.response?.data?.message || 'Failed to reset password' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (errors.general) {
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

        {/* Error Message */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600">{errors.general}</p>
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Reset Your Password</h2>
        <p className="text-gray-600">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="6+ characters, include a number"
            className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
          />
          {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Confirm your new password"
            className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-[#0891B2] hover:bg-[#0284C7] disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors text-base shadow-md mt-6"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;