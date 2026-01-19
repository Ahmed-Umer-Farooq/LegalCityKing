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
        
        // Force immediate redirect using window.location.replace
        const dashboardPath = userData.role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard';
        const finalUrl = dashboardPath + (welcome === 'true' ? '?welcome=true' : '');
        console.log('OAuth callback - redirecting to:', finalUrl);
        window.location.replace(finalUrl);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        window.location.replace('/login?error=oauth_failed');
      }
    } else {
      console.error('OAuth callback - missing data, redirecting to login');
      window.location.replace('/login?error=missing_oauth_data');
    }
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