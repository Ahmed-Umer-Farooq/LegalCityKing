import React, { useState, useEffect } from 'react';
import { Menu, Search, Grid3x3, Calendar, Folder, CheckSquare, FileText, MessageCircle, HelpCircle, Edit3, Users, UserPlus, DollarSign, Share2, User, Settings, LogOut, BarChart3 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MessageNotification from '../../components/MessageNotification';
import { useAuth } from '../../context/AuthContext';

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
    {
      title: "Account",
      items: [
        { icon: "user", label: "Profile", path: "/user/profile-settings" },
        { icon: "settings", label: "Settings", path: "/user/account-settings" },
      ]
    }
  ];
  
  const { logout } = useAuth();
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      // AuthContext logout() already handles redirection to login page
    }
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
              <p className="text-[#6B7280] text-xs font-semibold tracking-wider uppercase">
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
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Log out' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm">Log out</span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
};

// Header Component
const Header = ({ onMenuClick, sidebarWidth, currentUser, onChatClick }) => {
  const { user } = useAuth();
  const userName = user?.first_name || user?.name || currentUser?.name || 'User';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const searchItems = [
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
    { title: 'Create New Case', path: '/user/legal-cases', type: 'action', description: 'Add a new legal case' },
    { title: 'Schedule Appointment', path: '/user/calendar-appointments', type: 'action', description: 'Book a new appointment' },
    { title: 'Add Task', path: '/user/legal-tasks', type: 'action', description: 'Create a new task' },
    { title: 'Send Message', path: '/user/messages', type: 'action', description: 'Compose a new message' },
    { title: 'Find Lawyer', path: '/user/lawyer-directory', type: 'action', description: 'Search for legal professionals' }
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
              placeholder="Search pages, actions..."
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
            onChatClick={onChatClick}
          />
        )}
      </div>
    </header>
  );
};

// Dashboard Stats Component
const DashboardStats = () => {
  const stats = [
    { label: "Active Cases", value: "12", icon: Folder, bgColor: "bg-[#E2F1FF]", iconBg: "bg-[#007EF4]", textColor: "text-[#03498B]" },
    { label: "Pending Tasks", value: "8", icon: CheckSquare, bgColor: "bg-[#FFF4E0]", iconBg: "bg-[#F5AB23]", textColor: "text-[#654C1F]" },
    { label: "Messages", value: "24", icon: MessageCircle, bgColor: "bg-[#DCFCE7]", iconBg: "bg-[#16D959]", textColor: "text-[#1F5632]" },
    { label: "Appointments", value: "3", icon: Calendar, bgColor: "bg-[#FFE3E1]", iconBg: "bg-[#E6372B]", textColor: "text-[#931B12]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl p-6 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stat.textColor}`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>{stat.value}</p>
              <div className="flex items-center text-xs mt-1">
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className={`w-12 h-12 ${stat.iconBg} rounded-full flex items-center justify-center`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 w-16 h-16 ${stat.iconBg}/10 rounded-full -mr-8 -mb-8`}></div>
        </div>
      ))}
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { label: "Find a Lawyer", path: "/user/lawyer-directory", icon: Users },
    { label: "New Case", path: "/user/legal-cases", icon: Folder },
    { label: "Schedule Meeting", path: "/user/calendar-appointments", icon: Calendar },
    { label: "Send Message", path: "/user/messages", icon: MessageCircle },
    { label: "Legal Forms", path: "/user/legal-forms", icon: FileText },
    { label: "Q&A Forum", path: "/user/legal-questions-answers", icon: HelpCircle },
    { label: "Legal Blog", path: "/user/legal-blog", icon: Edit3 },
    { label: "Profile Settings", path: "/user/profile-settings", icon: User },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#F8F9FA] shadow-sm p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-[#181A2A] text-lg font-semibold mb-1">Quick Actions</h2>
        <p className="text-[#737791] text-sm">Frequently used actions</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className="flex flex-col items-center gap-2 p-3 bg-[#F8F9FA] hover:bg-[#E5E7EB] rounded-lg transition-all min-h-[80px]"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <action.icon className="w-6 h-6 text-[#6B7280]" />
            </div>
            <span className="text-xs font-medium text-center leading-tight text-[#374151]">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = () => {
  const activities = [
    { type: "case", message: "New case assigned: Personal Injury Claim", time: "2 hours ago" },
    { type: "message", message: "Message from John Smith (Lawyer)", time: "4 hours ago" },
    { type: "task", message: "Document review completed", time: "1 day ago" },
    { type: "appointment", message: "Consultation scheduled for tomorrow", time: "2 days ago" },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#F8F9FA] shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-[#181A2A] text-lg font-semibold mb-1">Recent Activity</h2>
        <p className="text-[#737791] text-sm">Latest updates and actions</p>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors">
            <div className="w-2 h-2 bg-[#6B7280] rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm text-[#374151] font-medium">{activity.message}</p>
              <p className="text-xs text-[#6B7280] mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Content
const DashboardContent = () => {
  const { user } = useAuth();
  const userName = user?.first_name || user?.name || 'User';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#181A2A] mb-2">Welcome back, {userName}!</h1>
        <p className="text-[#737791]">Here's what's happening with your legal matters today.</p>
      </div>
      
      <DashboardStats />
      <QuickActions />
      <RecentActivity />
    </div>
  );
};

// Profile Card Component
const ProfileCard = () => {
  return (
    <div className="w-full max-w-72">
      <div className="bg-white p-1.5 flex flex-col items-center gap-16">
        <div className="flex flex-col items-center relative w-full">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/643da3cc8518982bf4ef3bbcb722fd491b2e563d?width=556"
            alt="Background"
            className="w-full h-32 object-cover"
          />
          <div className="absolute -bottom-12">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-purple-100 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center px-6">
          <h3 className="text-gray-800 font-bold text-sm">Dmitry Kargaev</h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            I have a small business and like others, during the pandemic I ran into a lot of
            difficulties. I thought I would have to declare bankruptcy and close the business
          </p>
        </div>
      </div>

      <button className="w-full bg-gradient-to-b from-[#0071BC] to-[#00D2FF] text-white font-medium text-base uppercase py-3 rounded-md rounded-bl-none mt-1">
        Ask questions
      </button>
    </div>
  );
};

// Messages Widget Component
const MessagesWidget = () => {
  return (
    <div className="w-full max-w-72">
      <div className="bg-white rounded-xl shadow-lg p-5">
        <h2 className="text-blue-900 font-bold text-lg mb-2">Messages</h2>

        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border border-green-300 overflow-hidden">
              <div className="w-full h-full bg-purple-100"></div>
            </div>
          </div>
          <div>
            <h3 className="text-blue-900 font-bold text-sm">Legal City</h3>
            <p className="text-gray-500 text-sm font-medium">Lawyer</p>
          </div>
        </div>

        <p className="text-gray-500 text-sm font-medium mb-4">Open Full Chat</p>

        <div className="border-t border-black/20 pt-4 mb-4"></div>

        <div className="space-y-3 mb-6">
          <div className="flex flex-col items-end gap-2">
            <div className="bg-blue-500 rounded px-4 py-3 w-full">
              <p className="text-white text-xs font-medium">Hello Sir, I have a problem.</p>
            </div>
            <span className="text-gray-500 text-xs font-medium">8:30</span>
          </div>

          <div className="flex flex-col items-start gap-2">
            <div className="bg-gray-100 rounded px-4 py-3">
              <p className="text-gray-500 text-xs font-medium">
                Hi Veer, Thanks for contacting us ok
                <br />
                so let's tell me your problem.
              </p>
            </div>
            <span className="text-gray-500 text-xs font-medium">8:35</span>
          </div>
        </div>

        <div className="bg-gray-200 rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder="Write a message...."
            className="w-full bg-transparent border-none outline-none text-xs text-gray-500 placeholder:text-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

// Footer Component
const Footer = ({ sidebarWidth = 0 }) => {
  const footerSections = [
    {
      title: "Browse Our Site",
      links: [
        { text: "Find a Lawyer", path: "/dashboard/find-lawyer" },
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
                      href={typeof link === 'object' ? link.path : "/"}
                      className="text-gray-300 text-sm leading-relaxed hover:text-white transition-colors"
                    >
                      {typeof link === 'object' ? link.text : link}
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

// Main Layout Component
const Layout = ({ children, showFooter = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  
  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  // Prevent browser back button
  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    
    preventBack();
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const handleChatClick = () => {
    navigate('/user/messages');
  };

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
        sidebarWidth={window.innerWidth >= 1024 ? sidebarWidth : 0}
        currentUser={currentUser}
        onChatClick={handleChatClick}
      />

      <main className="pt-24 min-h-screen transition-all duration-300" style={{ marginLeft: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0' }}>
        <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {showFooter && <Footer sidebarWidth={window.innerWidth >= 1024 ? sidebarWidth : 0} />}
    </div>
  );
};

// Main App Component (Default Export)
const UserDashboard = () => {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
};

export default UserDashboard;