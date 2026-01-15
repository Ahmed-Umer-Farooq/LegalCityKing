import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';


const Login = ({ onSwitchToRegister, onSwitchToForgot, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check for OAuth error in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      if (error === 'oauth_failed') {
        showToast.error('Google login failed. Please try again.');
      } else {
        showToast.error(decodeURIComponent(error));
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    registrationId: '' // Only for lawyer
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'registrationId' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Lawyer needs Registration ID
    if (userType === 'lawyer') {
      if (!formData.registrationId.trim()) {
        newErrors.registrationId = 'Registration ID is required';
      } else if (!/^[A-Z]{2}\d{6}$/.test(formData.registrationId)) {
        newErrors.registrationId = 'Must be 2 letters followed by 6 digits (e.g., AB123456)';
      }
    }
    
    // Common validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const loginData = {
          email: formData.email,
          password: formData.password,
          registration_id: userType === 'lawyer' ? formData.registrationId : undefined,
        };

        const response = await api.post('/auth/login', loginData);
        const { token, user } = response.data;

        onLoginSuccess(token, user, response.data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        showToast.error(errorMessage);
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

  return (
    <div className="w-full">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <div 
          className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <div className="bg-[#0284C7] rounded-full px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 shadow-lg inline-flex">
            <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl">Legal</span>
          </div>
          <span className="text-[#0284C7] font-bold text-xl sm:text-2xl md:text-3xl">City</span>
        </div>
        <p className="text-[#0284C7] text-xs sm:text-sm font-semibold tracking-wider uppercase">
          " Legal for the people "
        </p>
      </div>

      {/* User Type Toggle */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 mb-6 sm:mb-8">
        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <input
            type="radio"
            name="userType"
            checked={userType === 'user'}
            onChange={() => setUserType('user')}
            className="w-4 h-4 sm:w-5 sm:h-5 text-[#0EA5E9] focus:ring-[#0EA5E9] focus:ring-2 border-2 border-gray-300"
          />
          <span className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-[#0EA5E9] transition-colors">
            User
          </span>
        </label>
        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <input
            type="radio"
            name="userType"
            checked={userType === 'lawyer'}
            onChange={() => setUserType('lawyer')}
            className="w-4 h-4 sm:w-5 sm:h-5 text-[#0EA5E9] focus:ring-[#0EA5E9] focus:ring-2 border-2 border-gray-300"
          />
          <span className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-[#0EA5E9] transition-colors">
            Lawyer
          </span>
        </label>
      </div>

      {/* Login Forms */}
      <div className="space-y-4 sm:space-y-5">
        {/* USER LOGIN FORM */}
        {userType === 'user' && (
          <>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Password</label>
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-xs text-gray-500 hover:text-[#0EA5E9] font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="8+ characters"
                  className="w-full px-4 py-3 pr-10 bg-gray-200 border-0 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </>
        )}

        {/* LAWYER LOGIN FORM */}
        {userType === 'lawyer' && (
          <>
            {/* Registration ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Registration ID</label>
              <input
                type="text"
                name="registrationId"
                value={formData.registrationId}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="AB123456"
                maxLength="8"
                className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
              {errors.registrationId && <p className="text-red-500 text-xs mt-1">{errors.registrationId}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Password</label>
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-xs text-gray-500 hover:text-[#0EA5E9] font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="8+ characters"
                  className="w-full px-4 py-3 pr-10 bg-gray-200 border-0 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </>
        )}

        {/* Login Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 sm:py-3.5 bg-[#0891B2] hover:bg-[#0284C7] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-sm sm:text-base shadow-md mt-4 sm:mt-6"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        {/* Back to Home Link */}
        <div className="text-center mb-4">
          <p className="text-gray-600 text-sm">
            Just browsing?{' '}
            <button
              onClick={() => navigate('/')}
              type="button"
              className="text-[#0EA5E9] font-semibold hover:underline"
            >
              back to home
            </button>
          </p>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Not a member?{' '}
            <button
              onClick={onSwitchToRegister}
              type="button"
              className="text-[#0EA5E9] font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-medium">OR</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google Login - Role-Based */}
          <button
            type="button"
            onClick={() => {
              const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5001';
              window.location.href = `${baseUrl}/api/auth/google?role=${userType}`;
            }}
            className="w-full py-3 px-4 border-2 border-gray-300 rounded-md flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
              <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
              <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
              <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
            </svg>
            <span className="font-medium text-gray-700 text-sm">
              Continue with Google as {userType === 'lawyer' ? 'Lawyer' : 'User'}
            </span>
          </button>


        </div>
      </div>


    </div>
  );
};

export default Login;
