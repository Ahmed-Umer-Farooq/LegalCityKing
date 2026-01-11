import React, { useState, useEffect } from 'react';
import { Menu, Search, Grid3x3, Calendar, Folder, CheckSquare, FileText, MessageCircle, HelpCircle, Edit3, Users, UserPlus, DollarSign, Share2, User, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import MessageNotification from '../MessageNotification';

// Sidebar Component
const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const activeElement = document.querySelector('.bg-blue-600');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.pathname]);
  
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { icon: "grid-3x3", label: "Dashboard", path: "/user-dashboard" },
        { icon: "calendar", label: "Calendar", path: "/user/calendar-appointments" },
      ]
    },
    {
      title: "Case Management",
      items: [
        { icon: "folder", label: "Cases", path: "/user/legal-cases" },
        { icon: "check-square", label: "Tasks", path: "/user/legal-tasks" },
        { icon: "file-text", label: "Forms", path: "/user/legal-forms" },
      ]
    },
    {
      title: "Communication",
      items: [
        { icon: "message-circle", label: "Messages", path: "/user/messages" },
        { icon: "help-circle", label: "Q&A", path: "/user/legal-questions-answers" },
        { icon: "edit-3", label: "Blog", path: "/user/legal-blog" },
      ]
    },
    {
      title: "Legal Services",
      items: [
        { icon: "users", label: "Directory", path: "/user/lawyer-directory" },
        { icon: "user-plus", label: "Refer", path: "/user/referral-program" },
      ]
    },
    {
      title: "Business",
      items: [
        { icon: "dollar-sign", label: "Accounting", path: "/user/accounting-billing" },
        { icon: "share-2", label: "Social Media", path: "/user/social-media-management" },
      ]
    },

  ];
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Navigate to logout page
    navigate('/logout');
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-300 overflow-y-auto z-20 transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        <div className={`${isCollapsed ? 'px-2' : 'px-6'} pt-16 pb-8 transition-all duration-300`}>
          {!isCollapsed && (
            <div 
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/user-dashboard')}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#0284C7] rounded-full px-4 py-2 shadow-lg inline-flex">
                  <span className="text-white font-bold text-xl">Legal</span>
                </div>
                <span className="text-[#0284C7] font-bold text-xl">City</span>
              </div>
              <p className="text-[#0284C7] text-xs font-semibold tracking-wider uppercase">
                " Legal for the people "
              </p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:block absolute top-4 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} flex flex-col gap-6 transition-all duration-300 overflow-y-auto`} style={{ scrollBehavior: 'smooth' }}>
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.path;
                  const IconComponent = {
                    'grid-3x3': Grid3x3, 'calendar': Calendar, 'folder': Folder, 'check-square': CheckSquare,
                    'file-text': FileText, 'message-circle': MessageCircle, 'help-circle': HelpCircle,
                    'edit-3': Edit3, 'users': Users, 'user-plus': UserPlus, 'dollar-sign': DollarSign,
                    'share-2': Share2, 'user': User, 'settings': Settings
                  }[item.icon];
                  
                  if (item.label === 'Dashboard') {
                    return (
                      <button
                        key={itemIndex}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/20 shadow-sm backdrop-blur-sm' 
                            : 'text-[#6B7280] hover:bg-[#0284C7]/5 hover:text-[#0284C7]'
                        }`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium text-sm">{item.label}</span>
                        )}
                      </button>
                    );
                  }
                  
                  return (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/20 shadow-sm backdrop-blur-sm' 
                          : 'text-[#6B7280] hover:bg-[#0284C7]/5 hover:text-[#0284C7]'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          

        </nav>
      </div>
    </aside>
  );
};

// Header Component
const Header = ({ onMenuClick, sidebarWidth }) => {
  const { user, logout } = useAuth();
  const userName = user?.first_name || user?.name || 'User';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
    };
    
    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const handleChatClick = () => {
    navigate('/user/messages');
  };

  const searchItems = [
    // Pages
    { title: 'Dashboard', path: '/user-dashboard', type: 'page' },
    { title: 'Calendar & Appointments', path: '/user/calendar-appointments', type: 'page' },
    { title: 'Legal Cases', path: '/user/legal-cases', type: 'page' },
    { title: 'Legal Tasks', path: '/user/legal-tasks', type: 'page' },
    { title: 'Legal Forms', path: '/user/legal-forms', type: 'page' },
    { title: 'Messages', path: '/user/messages', type: 'page' },
    { title: 'Legal Q&A', path: '/user/legal-questions-answers', type: 'page' },
    { title: 'Legal Blog', path: '/user/legal-blog', type: 'page' },
    { title: 'Lawyer Directory', path: '/user/lawyer-directory', type: 'page' },
    { title: 'Referral Program', path: '/user/referral-program', type: 'page' },
    { title: 'Accounting & Billing', path: '/user/accounting-billing', type: 'page' },
    { title: 'Social Media Management', path: '/user/social-media-management', type: 'page' },
    { title: 'Profile Settings', path: '/user/profile-settings', type: 'page' },
    { title: 'Account Settings', path: '/user/account-settings', type: 'page' },
    // Content
    { title: 'Create New Case', path: '/cases', type: 'action', description: 'Add a new legal case' },
    { title: 'Schedule Appointment', path: '/calendar', type: 'action', description: 'Book a new appointment' },
    { title: 'Add Task', path: '/tasks', type: 'action', description: 'Create a new task' },
    { title: 'Send Message', path: '/messages', type: 'action', description: 'Compose a new message' },
    { title: 'Ask Question', path: '/qa', type: 'action', description: 'Post a new question' },
    { title: 'Find Lawyer', path: '/directory', type: 'action', description: 'Search for legal professionals' },
    { title: 'Create Invoice', path: '/accounting', type: 'action', description: 'Generate a new invoice' },
    { title: 'Record Payment', path: '/accounting', type: 'action', description: 'Log a payment received' },
    { title: 'Legal Forms', path: '/forms', type: 'content', description: 'Access legal document templates' },
    { title: 'Referral Program', path: '/refer', type: 'content', description: 'Refer clients and earn rewards' },
    { title: 'Account Settings', path: '/settings', type: 'content', description: 'Manage your account preferences' },
    { title: 'Profile Information', path: '/profile', type: 'content', description: 'Update your personal details' },
    { title: 'Social Media Links', path: '/social-media', type: 'content', description: 'Manage social media presence' },
    { title: 'Blog Posts', path: '/blog', type: 'content', description: 'Read latest legal articles' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = searchItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleResultClick = (path) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(path);
  };
  
  return (
    <header className={`fixed top-0 left-0 right-0 h-24 bg-white z-10 flex items-center justify-between px-4 md:px-8 transition-all duration-300`} style={{ left: `${sidebarWidth}px` }}>
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      <h1 className="text-blue-900 font-semibold text-xl md:text-3xl leading-none tracking-tight">
        Welcome Back, {userName}
      </h1>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <div className="flex items-center gap-2 px-5 h-10 rounded-full border border-gray-300 w-full max-w-sm">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search pages, actions, content..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-500"
            />
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-12 right-0 w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {searchResults.slice(0, 8).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(item.path)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="font-medium text-gray-900">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                  )}
                  <div className="text-xs text-blue-600 capitalize mt-1">{item.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {currentUser && (
          <MessageNotification 
            currentUser={currentUser} 
            onChatClick={handleChatClick}
          />
        )}
        
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            {userName.charAt(0).toUpperCase()}
          </button>
          {showProfileMenu && (
            <div 
              className="absolute top-12 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/user/profile-settings');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/user/account-settings');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Logging out...', { duration: 1000 });
                  setTimeout(() => {
                    logout();
                  }, 1000);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg flex items-center gap-3 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Footer Component
const Footer = ({ sidebarWidth = 0 }) => {
  const footerSections = [
    {
      title: "Browse Our Site",
      links: [
        "Find a Lawyer",
        "Review Your Lawyer",
        "Legal Advice",
        "Recently Answered Questions",
        "Browse Practice Areas",
        "Avvo Stories Blog",
      ],
    },
    {
      title: "Popular Locations",
      links: [
        "New York City Lawyers",
        "Los Angeles Lawyers",
        "Chicago Lawyers",
        "Houston Lawyers",
        "Washington, DC Lawyers",
        "Philadelphia Lawyers",
        "Phoenix Lawyers",
        "San Antonio Lawyers",
        "San Diego Lawyers",
      ],
    },
    {
      title: "Popular Practice Areas",
      links: [
        "Bankruptcy & Debt Lawyers",
        "Business Lawyers",
        "Criminal Defense Lawyers",
        "DUI & DWI Lawyers",
        "Estate Planning Lawyers",
        "Car Accident Lawyers",
        "Divorce & Separation Lawyers",
        "Intellectual Property Lawyers",
        "Speeding & Traffic Lawyers",
      ],
    },
    {
      title: "About",
      links: ["About Avvo", "Careers", "Support", "Avvo Rating Explained"],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white py-10 transition-all duration-300" style={{ marginLeft: `${sidebarWidth}px` }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-24 mb-8">
          {footerSections.map((section, index) => (
            <div key={index} className="flex flex-col gap-3">
              <h3 className="font-bold text-base leading-6">{section.title}</h3>
              <ul className="flex flex-col">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="/"
                      className="text-gray-300 text-sm leading-relaxed hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8 pt-8 border-t border-gray-600">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <a href="/" className="text-gray-300 hover:text-white pr-2 border-r border-gray-300">
              Terms of Use
            </a>
            <a href="/" className="text-gray-300 hover:text-white px-2 border-r border-gray-300">
              Privacy Policy
            </a>
            <a href="/" className="text-gray-300 hover:text-white px-2 border-r border-gray-300">
              Do Not Sell or Share My Personal Information
            </a>
            <a href="/" className="text-gray-300 hover:text-white px-2 border-r border-gray-300">
              Community Guidelines
            </a>
            <a href="/" className="text-gray-300 hover:text-white px-2">
              Sitemap
            </a>
          </div>

          <p className="text-gray-300 text-sm">© Avvo Inc. All Rights Reserved 2023</p>
        </div>
      </div>
    </footer>
  );
};

// Main Shared Layout Component
const SharedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <div className="min-h-screen bg-[#F1F9FF]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarWidth={typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : 0}
      />

      <main className="pt-24 min-h-screen transition-all duration-300" style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default SharedLayout;