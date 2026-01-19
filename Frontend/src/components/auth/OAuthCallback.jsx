import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    console.log('OAuth callback - URL params:', window.location.search);
    
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const welcome = searchParams.get('welcome');
    
    console.log('OAuth callback - token:', token ? 'present' : 'missing');
    console.log('OAuth callback - user:', userParam ? 'present' : 'missing');

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('OAuth callback - parsed user:', userData);
        
        // Store in localStorage like normal login
        login(token, userData);
        
        // Redirect to appropriate dashboard
        const dashboardPath = userData.role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard';
        console.log('OAuth callback - redirecting to:', dashboardPath);
        navigate(dashboardPath + (welcome === 'true' ? '?welcome=true' : ''));
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    } else {
      console.error('OAuth callback - missing data, redirecting to login');
      navigate('/login?error=missing_oauth_data');
    }
    
    // Timeout fallback
    const timeout = setTimeout(() => {
      console.error('OAuth callback timeout - redirecting to login');
      navigate('/login?error=oauth_timeout');
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;