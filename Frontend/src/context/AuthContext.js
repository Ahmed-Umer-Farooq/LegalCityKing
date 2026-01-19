import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check for OAuth authentication
  const checkOAuthAuth = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/oauth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken('oauth_authenticated'); // Set a flag for OAuth users
        return userData;
      }
    } catch (error) {
      console.error('OAuth auth check failed:', error);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      // Check for OAuth redirect data first
      const oauthRedirect = sessionStorage.getItem('oauth_redirect');
      const oauthUser = sessionStorage.getItem('oauth_user');
      
      if (oauthRedirect === 'true' && oauthUser) {
        try {
          const userData = JSON.parse(oauthUser);
          setUser(userData);
          setToken('oauth_authenticated');
          
          // Clean up session storage
          sessionStorage.removeItem('oauth_redirect');
          sessionStorage.removeItem('oauth_user');
          
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing OAuth user data:', error);
          sessionStorage.removeItem('oauth_redirect');
          sessionStorage.removeItem('oauth_user');
        }
      }
      
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      // Clean up any multi-session data
      localStorage.removeItem('multiSessions');
      localStorage.removeItem('token_user');
      localStorage.removeItem('token_lawyer');
      localStorage.removeItem('token_admin');
      localStorage.removeItem('user_user');
      localStorage.removeItem('user_lawyer');
      localStorage.removeItem('user_admin');
      
      // First check localStorage for JWT tokens (normal login)
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          // Validate token is not expired
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            // Token expired, clear storage and check OAuth
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            await checkOAuthAuth();
          } else {
            setUser(userData);
            setToken(storedToken);
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Check OAuth as fallback
          await checkOAuthAuth();
        }
      } else {
        // No localStorage data, check for OAuth authentication
        await checkOAuthAuth();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Auth status set
  };

  const logout = async () => {
    // If user was authenticated via OAuth, call OAuth logout
    if (token === 'oauth_authenticated') {
      try {
        await fetch('http://localhost:5001/api/oauth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('OAuth logout failed:', error);
      }
    }
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clean up any remaining multi-session data
    localStorage.removeItem('multiSessions');
    localStorage.removeItem('returnPath');
    localStorage.removeItem('navigatedFromDashboard');
    sessionStorage.clear();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    checkOAuthAuth,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;