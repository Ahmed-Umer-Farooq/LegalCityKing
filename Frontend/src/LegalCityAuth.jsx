import React, {  useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import LawyerDirectory from './pages/public/LawyerDirectory';

const AuthContent = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

  const handleRegisterSuccess = (email) => {
    setPendingVerificationEmail(email);
    setAuthMode('verify');
  };

  const handleVerificationSuccess = () => {
    setAuthMode('login');
    setPendingVerificationEmail('');
  };

  const handleAuthRedirect = (userData) => {
    console.log('Redirect Logic - Full User Data:', userData);
    
    // Priority 1: Custom redirect
    if (userData.redirect) {
      return userData.redirect;
    }
    
    // Priority 2: Admin check  
    if (userData.is_admin === true || userData.role === 'admin') {
      return '/admin-dashboard';
    }
    
    // Priority 3: Lawyer check - Check multiple possible fields
    if (userData.role === 'lawyer' || 
        userData.user_type === 'lawyer' || 
        userData.registration_id || 
        userData.registrationId ||
        userData.is_lawyer === true) {
      console.log('Redirecting to lawyer dashboard');
      return '/lawyer-dashboard';
    }
    
    // Priority 4: Default user
    console.log('Redirecting to user dashboard');
    return '/user-dashboard';
  };

  const handleLoginSuccess = (token, userData, responseData) => {
    console.log('Login Success - User Data:', userData);
    
    login(token, userData);
    
    // Check for saved redirect URL from blog access
    const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
    if (savedRedirect) {
      sessionStorage.removeItem('redirectAfterLogin');
      console.log('Redirecting to saved blog URL:', savedRedirect);
      navigate(savedRedirect);
      return;
    }
    
    const redirectPath = handleAuthRedirect(userData);
    console.log('Navigating to:', redirectPath);
    navigate(redirectPath);
  };

  const handleLogout = () => {
    logout();
    setAuthMode('login');
  };

  const handleResetSuccess = () => {
    setAuthMode('login');
  };


  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left blue sidebar */}
      <Sidebar isAuthPage={true} />

      {/* Right form area */}
      <main className="flex-1 flex items-start justify-start pt-12 pl-16 pr-16 pb-12 lg:pl-16 lg:pr-16 px-4 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-[620px] lg:max-w-[620px] max-w-md mx-auto lg:mx-0">
          {authMode === 'register' ? (
            <Register
              onSwitchToLogin={() => { setAuthMode('login'); navigate('/login'); }}
              onRegisterSuccess={handleRegisterSuccess}
            />
          ) : authMode === 'login' ? (
            <Login
              onSwitchToRegister={() => { setAuthMode('register'); navigate('/register'); }}
              onSwitchToForgot={() => setAuthMode('forgot')}
              onLoginSuccess={handleLoginSuccess}

            />
          ) : authMode === 'forgot' ? (
            <ForgotPassword onSwitchToLogin={() => { setAuthMode('login'); navigate('/login'); }} />
          ) : authMode === 'verify' ? (
            <VerifyEmail
              email={pendingVerificationEmail}
              onVerified={handleVerificationSuccess}
              onSwitchToLogin={() => { setAuthMode('login'); navigate('/login'); }}
            />
          ) : authMode === 'reset' ? (
            <ResetPassword onResetSuccess={handleResetSuccess} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

const LegalCityAuth = () => {
  return <AuthContent />;
};

export default LegalCityAuth;
