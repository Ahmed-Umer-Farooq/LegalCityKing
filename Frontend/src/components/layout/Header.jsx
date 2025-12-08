import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navigateToDashboard } from '../../utils/dashboardRedirect';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.relative')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'shadow-lg' : 'shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-full px-4 py-2 flex items-center gap-0">
                <span className="text-xl font-bold text-white">Lega</span>
                <svg width="4" height="24" viewBox="0 0 4 24" fill="none" className="mx-0.5">
                  <rect x="0" y="2" width="4" height="20" fill="#ffffff"/>
                  <polygon points="2,0 0,2 4,2" fill="#ffffff"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-blue-600">City</span>
            </div>
          </Link>
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/" 
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </Link>
              <div 
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/lawyers') || isActive('/find-lawyer') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}>
                  Lawyer Directory
                </button>
                <div className={`absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md border transition-all duration-200 z-50 ${
                  isDropdownOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}>
                  <Link 
                    to="/find-lawyer" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Find Lawyer
                  </Link>
                  <Link 
                    to="/lawyers" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Lawyers
                  </Link>
                </div>
              </div>
              <Link 
                to="/legal-blog" 
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/legal-blog') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Blog
              </Link>
              <Link 
                to="/legal-forms" 
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/legal-forms') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Legal Forms
              </Link>
              <Link 
                to="/qa" 
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/qa') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Q&A
              </Link>
              <Link 
                to="/contact-us" 
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/contact-us') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Contact
              </Link>
            </nav>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{user?.name}</span>
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border z-50">
                      <button
                        onClick={() => {
                          navigateToDashboard(navigate, user);
                          setUserDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          navigate('/');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
