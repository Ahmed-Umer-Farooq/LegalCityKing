import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, FileText, Phone, Mail, Clock, CreditCard, Users, DollarSign, File, ChevronLeft, ChevronRight, PieChart, Home, UserCheck, BarChart3, CheckSquare, FolderOpen, MessageCircle, Edit3, Save, X, Camera, Briefcase, Building, Globe, Lock, Settings, MapPin } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

// Lazy load components to prevent import errors
const QuickActions = React.lazy(() => import('../../components/QuickActions').catch(() => ({ default: () => <div>Quick Actions Loading...</div> })));
const CreateClientModal = React.lazy(() => import('../../components/modals/CreateClientModal').catch(() => ({ default: () => null })));
const CreateEventModal = React.lazy(() => import('../../components/modals/CreateEventModal').catch(() => ({ default: () => null })));
const CreateTaskModal = React.lazy(() => import('../../components/modals/CreateTaskModal').catch(() => ({ default: () => null })));
const CreateContactModal = React.lazy(() => import('../../components/modals/CreateContactModal').catch(() => ({ default: () => null })));
const CreateCaseModal = React.lazy(() => import('../../components/modals/CreateCaseModal').catch(() => ({ default: () => null })));
const CreateNoteModal = React.lazy(() => import('../../components/modals/CreateNoteModal').catch(() => ({ default: () => null })));
const LogCallModal = React.lazy(() => import('../../components/modals/LogCallModal').catch(() => ({ default: () => null })));
const SendMessageModal = React.lazy(() => import('../../components/modals/SendMessageModal').catch(() => ({ default: () => null })));
const TrackTimeModal = React.lazy(() => import('../../components/modals/TrackTimeModal').catch(() => ({ default: () => null })));
const AddExpenseModal = React.lazy(() => import('../../components/modals/AddExpenseModal').catch(() => ({ default: () => null })));
const CreateInvoiceModal = React.lazy(() => import('../../components/modals/CreateInvoiceModal').catch(() => ({ default: () => null })));
const RecordPaymentModal = React.lazy(() => import('../../components/modals/RecordPaymentModal').catch(() => ({ default: () => null })));
const VerificationModal = React.lazy(() => import('../../components/modals/VerificationModal').catch(() => ({ default: () => null })));
const ContactsPage = React.lazy(() => import('./ContactsPage').catch(() => ({ default: () => <div>Contacts coming soon...</div> })));
const CalendarPage = React.lazy(() => import('./CalendarPage').catch(() => ({ default: () => <div>Calendar coming soon...</div> })));
const ReportsPage = React.lazy(() => import('./ReportsPage').catch(() => ({ default: () => <div>Reports coming soon...</div> })));
const TasksPage = React.lazy(() => import('./TasksPage').catch(() => ({ default: () => <div>Tasks coming soon...</div> })));
const DocumentsPage = React.lazy(() => import('./DocumentsPage').catch(() => ({ default: () => <div>Documents coming soon...</div> })));
const BlogManagement = React.lazy(() => import('./BlogManagement').catch(() => ({ default: () => <div>Blog Management coming soon...</div> })));
const ChatPage = React.lazy(() => import('../../pages/userdashboard/ChatPage').catch(() => ({ default: () => <div>Chat coming soon...</div> })));
const QAAnswers = React.lazy(() => import('./QAAnswers').catch(() => ({ default: () => <div>Q&A coming soon...</div> })));
const FormsManagement = React.lazy(() => import('./FormsManagement').catch(() => ({ default: () => <div>Forms coming soon...</div> })));
const ProfileManagement = React.lazy(() => import('./ProfileManagement').catch(() => ({ default: () => <div>Profile Management loading...</div> })));

export default function LawyerDashboard() {
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseType, setCaseType] = useState('civil');
  const [caseClient, setCaseClient] = useState('');
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ 
    activeCases: 0, 
    totalClients: 0, 
    monthlyRevenue: 0, 
    upcomingHearings: 0,
    percentageChanges: {
      activeCases: 0,
      totalClients: 0,
      monthlyRevenue: 0
    },
    caseDistribution: [],
    monthlyRevenueData: []
  });
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [blogEngagementCount, setBlogEngagementCount] = useState(0);

  // Subscription feature checks
  const isProfessional = currentUser?.subscription_tier === 'professional';
  const isPremium = currentUser?.subscription_tier === 'premium';
  const hasAdvancedFeatures = isProfessional || isPremium;
  const isVerified = currentUser?.verification_status === 'approved';


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
    // Set SEO meta tags
    document.title = 'Lawyer Dashboard - Professional Legal Practice Management | LegalCity';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive lawyer dashboard for managing cases, clients, invoices, and legal practice operations.');
    }
    
    fetchDashboardData();
    fetchUserProfile();
    
    // Initialize chat service for notifications
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser?.id) {
      import('../../utils/chatService').then(({ default: chatService }) => {
        chatService.connect({ userId: storedUser.id, userType: 'lawyer' });
        chatService.onUnreadCountUpdate(({ count }) => {
          setUnreadCount(count);
        });
        // Get initial unread count via API
        fetch('/api/chat/unread-count', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => res.json())
        .then(data => setUnreadCount(data.count || 0))
        .catch(err => {
          console.error('Failed to fetch unread count:', err);
          setUnreadCount(0);
        });
        
        // Get blog engagement count
        fetch('/api/blogs/engagement-count', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => res.json())
        .then(data => setBlogEngagementCount(data.count || 0))
        .catch(err => {
          console.error('Failed to fetch blog engagement count:', err);
          setBlogEngagementCount(0);
        });
      });
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, casesRes, clientsRes, invoicesRes, eventsRes] = await Promise.all([
        api.get('/lawyer/dashboard/stats'),
        api.get('/lawyer/cases?page=1&limit=10'),
        api.get('/lawyer/clients?page=1&limit=3'),
        api.get('/lawyer/invoices?page=1&limit=3'),
        api.get('/lawyer/upcoming-events')
      ]);
      
      setStats(statsRes.data || { 
        activeCases: 0, 
        totalClients: 0, 
        monthlyRevenue: 0, 
        upcomingHearings: 0,
        percentageChanges: { activeCases: 0, totalClients: 0, monthlyRevenue: 0 },
        caseDistribution: [],
        monthlyRevenueData: []
      });
      setCases(Array.isArray(casesRes.data) ? casesRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setUpcomingEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/lawyer/profile');
      const updatedUser = {
        ...response.data,
        is_verified: response.data.verification_status === 'approved',
        verified: response.data.verification_status === 'approved'
      };
      setCurrentUser(updatedUser);
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    }
  };

  const addCase = async () => {
    if (!caseTitle.trim()) return;

    try {
      const response = await api.post('/lawyer/cases', {
        title: caseTitle.trim(),
        type: caseType,
        client: caseClient.trim() || 'Unknown Client',
        description: caseClient.trim() ? `Case for ${caseClient.trim()}` : ''
      });
      
      if (response.data?.message) {
        setShowCaseForm(false);
        setCaseTitle('');
        setCaseClient('');
        setCaseType('civil');
        fetchDashboardData();
        toast.success('Case created successfully');
      }
    } catch (error) {
      console.error('Error adding case:', error);
      toast.error('Failed to create case');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const getStatusColors = (status) => {
    const colors = {
      active: 'bg-[#DCFCE7] text-[#1F5632]',
      pending: 'bg-[#FFF4E0] text-[#654C1F]',
      closed: 'bg-[#FFE3E1] text-[#931B12]',
      on_hold: 'bg-[#E5E7EB] text-[#374151]'
    };
    return colors[status?.toLowerCase()] || colors.active;
  };

  const getInvoiceStatusColors = (status) => {
    const colors = {
      paid: 'bg-[#DCFCE7] text-[#1F5632]',
      sent: 'bg-[#DBEAFE] text-[#1E40AF]',
      pending: 'bg-[#FFF4E0] text-[#654C1F]',
      draft: 'bg-[#E5E7EB] text-[#374151]',
      overdue: 'bg-[#FFE3E1] text-[#931B12]',
      cancelled: 'bg-[#F3F4F6] text-[#6B7280]'
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };



  return (
    <div className="min-h-screen bg-[#EDF4FF] w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="w-full bg-white border-b border-[#E5E7EB] shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 w-full">
            {/* Professional Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="bg-[#0284C7] rounded-full px-4 py-2 shadow-lg">
                <span className="text-white font-bold text-xl tracking-tight">Legal</span>
              </div>
              <span className="text-[#0284C7] font-bold text-xl tracking-tight">City</span>
            </div>
            
            {/* Navigation Sections */}
            <nav className="hidden lg:flex items-center gap-4">
              {[
                { id: 'home', label: 'Home', icon: Home, action: () => { setActiveNavItem('home'); window.scrollTo(0, 0); } },
                { id: 'messages', label: 'Messages', icon: MessageCircle, action: () => { setActiveNavItem('messages'); }, showNotification: true, restricted: !isVerified },
                { id: 'contacts', label: 'Contacts', icon: UserCheck, action: () => { setActiveNavItem('contacts'); }, restricted: !isVerified },
                { id: 'calendar', label: 'Calendar', icon: Calendar, action: () => { setActiveNavItem('calendar'); }, restricted: !isVerified },
                { id: 'reports', label: 'Reports', icon: BarChart3, action: () => { setActiveNavItem('reports'); }, restricted: !hasAdvancedFeatures || !isVerified },
                { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => { setActiveNavItem('tasks'); }, restricted: !isVerified },
                { id: 'documents', label: 'Documents', icon: FolderOpen, action: () => { setActiveNavItem('documents'); }, restricted: !isVerified },
                { id: 'forms', label: 'Forms', icon: File, action: () => { setActiveNavItem('forms'); }, restricted: !isPremium || !isVerified },
                { id: 'blogs', label: 'Blogs', icon: FileText, action: () => { setActiveNavItem('blogs'); setBlogEngagementCount(0); }, showNotification: true, notificationCount: blogEngagementCount, restricted: !hasAdvancedFeatures || !isVerified },
                { id: 'qa', label: 'Q&A', icon: Mail, action: () => { setActiveNavItem('qa'); }, restricted: !isPremium || !isVerified },
                { id: 'subscription', label: 'Subscription', icon: CreditCard, action: () => { window.location.href = '/lawyer-dashboard/subscription'; } }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNavItem === item.id;
                const isRestricted = item.restricted;
                return (
                  <button
                    key={item.id}
                    onClick={isRestricted ? (
                      !isVerified ? () => setShowVerificationModal(true) : () => { window.location.href = '/lawyer-dashboard/subscription'; }
                    ) : (item.action || (() => setActiveNavItem(item.id)))}
                    className={`relative flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#EDF3FF] text-[#0086CB] shadow-sm' 
                        : 'text-[#181A2A] hover:text-[#0086CB] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:block">{item.label}</span>
                    {isRestricted && (
                      !isVerified ? (
                        <svg className="w-2 h-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold text-orange-500">P</span>
                      )
                    )}
                    {item.showNotification && (
                      item.id === 'messages' ? (
                        unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )
                      ) : item.id === 'blogs' ? (
                        blogEngagementCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {blogEngagementCount > 9 ? '9+' : blogEngagementCount}
                          </span>
                        )
                      ) : null
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Enhanced Search Bar */}
            <div className="flex items-center gap-4 bg-[#F9FAFB] rounded-xl px-4 py-3 w-full lg:w-auto lg:max-w-md border border-[#E5E7EB] focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/20 transition-all">
              <Search className="w-5 h-5 text-[#6B7280]" />
              <input 
                type="text" 
                placeholder="Search cases, clients, documents..." 
                className="text-[#374151] text-sm bg-transparent outline-none flex-1 placeholder-[#9CA3AF]"
              />
            </div>
            
            {/* Professional User Profile */}
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-lg px-2 py-1.5 border border-[#E5E7EB] transition-all">
                <div className="w-6 h-6 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-[#1F2937] text-xs font-medium">{currentUser?.name || 'User'}</div>
                  <div className="text-[#6B7280] text-xs">{currentUser?.law_firm || 'Legal Professional'}</div>
                </div>
                <svg className="w-3 h-3 text-[#6B7280] transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E5E7EB] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1F2937]">{currentUser?.name || 'User'}</div>
                        <div className="text-xs text-[#6B7280]">{currentUser?.email || 'user@example.com'}</div>
                      </div>
                    </div>
                    {currentUser?.law_firm && (
                      <div className="text-xs text-[#6B7280] mb-1">{currentUser.law_firm}</div>
                    )}
                    {currentUser?.speciality && (
                      <div className="text-xs text-[#6B7280]">{currentUser.speciality}</div>
                    )}
                    {currentUser?.verified && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Verified Lawyer</span>
                      </div>
                    )}
                    {isPremium && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium">Premium Verified</span>
                      </div>
                    )}
                    {currentUser?.subscription_tier && currentUser.subscription_tier !== 'free' && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium capitalize">{currentUser.subscription_tier} Plan</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveNavItem('profile')} className="flex items-center gap-2 px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors w-full text-left">
                    <User className="w-4 h-4" />
                    Profile Management
                  </button>
                  {!currentUser?.is_verified && (
                    <button onClick={() => setShowVerificationModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#0086CB] hover:bg-[#F9FAFB] transition-colors w-full text-left">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Get Verified
                    </button>
                  )}
                  {currentUser?.is_verified && (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified
                    </div>
                  )}
                  <hr className="my-2 border-[#E5E7EB]" />
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full px-4 md:px-6 lg:px-8 pb-16 max-w-screen-2xl mx-auto">
        {activeNavItem === 'contacts' && <ContactsPage />}
        {activeNavItem === 'calendar' && <CalendarPage />}
        {activeNavItem === 'reports' && <ReportsPage />}
        {activeNavItem === 'tasks' && <TasksPage />}
        {activeNavItem === 'documents' && <DocumentsPage />}
        {activeNavItem === 'forms' && <FormsManagement />}
        {activeNavItem === 'blogs' && <BlogManagement />}
        {activeNavItem === 'messages' && <ChatPage key="lawyer-chat" />}
        {activeNavItem === 'qa' && <QAAnswers />}
        
        {activeNavItem === 'profile' && (
          <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
            <ProfileManagement />
          </React.Suspense>
        )}
        
        {activeNavItem === 'home' && (
        <>

        {/* Overview Stats */}
        <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-7 mb-6">
          <div className="mb-9">
            <h2 className="text-[#181A2A] text-[17px] font-semibold mb-1">Overview</h2>
            <p className="text-[#737791] text-sm">Current Period Statistics</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#E2F1FF] rounded-xl p-4 relative overflow-hidden">
              <div className="w-[34px] h-[34px] bg-[#007EF4] rounded-full mb-3 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#03498B] text-xl font-semibold mb-2">Active Cases</h3>
              <p className="text-[#03498B] text-2xl font-bold mb-1">{stats.activeCases}</p>
              <div className="flex items-center text-xs">
                <span className={`font-medium ${
                  stats.percentageChanges?.activeCases >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.percentageChanges?.activeCases >= 0 ? '+' : ''}{stats.percentageChanges?.activeCases || 0}%
                </span>
                <span className="text-[#737791] ml-1">from last month</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#007EF4]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
            <div className="bg-[#DCFCE7] rounded-xl p-4 relative overflow-hidden">
              <div className="w-[34px] h-[34px] bg-[#16D959] rounded-full mb-3 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#1F5632] text-xl font-semibold mb-2">Total Clients</h3>
              <p className="text-[#1F5632] text-2xl font-bold mb-1">{stats.totalClients}</p>
              <div className="flex items-center text-xs">
                <span className={`font-medium ${
                  stats.percentageChanges?.totalClients >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.percentageChanges?.totalClients >= 0 ? '+' : ''}{stats.percentageChanges?.totalClients || 0}%
                </span>
                <span className="text-[#737791] ml-1">from last month</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#16D959]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
            <div className="bg-[#FFE3E1] rounded-xl p-4 relative overflow-hidden">
              <div className="w-[34px] h-[34px] bg-[#E6372B] rounded-full mb-3 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#931B12] text-xl font-semibold mb-2">Monthly Revenue</h3>
              <p className="text-[#931B12] text-2xl font-bold mb-1">${stats.monthlyRevenue?.toLocaleString() || '0'}</p>
              <div className="flex items-center text-xs">
                <span className={`font-medium ${
                  stats.percentageChanges?.monthlyRevenue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.percentageChanges?.monthlyRevenue >= 0 ? '+' : ''}{stats.percentageChanges?.monthlyRevenue || 0}%
                </span>
                <span className="text-[#737791] ml-1">from last month</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#E6372B]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
            <div className="bg-[#FFF4E0] rounded-xl p-4 relative overflow-hidden">
              <div className="w-[34px] h-[34px] bg-[#F5AB23] rounded-full mb-3 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#654C1F] text-xl font-semibold mb-2">Upcoming Hearings</h3>
              <p className="text-[#654C1F] text-2xl font-bold mb-1">{stats.upcomingHearings}</p>
              <div className="flex items-center text-xs">
                <span className="text-orange-600 font-medium">{Math.min(stats.upcomingHearings, 7)} this week</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#F5AB23]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[#181A2A] text-lg font-semibold mb-1">Revenue Overview</h3>
                <p className="text-[#737791] text-sm">Monthly earnings trend</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#007EF4] rounded-full"></div>
                <span className="text-sm text-[#737791]">2024</span>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {stats.monthlyRevenueData?.length > 0 ? (
                stats.monthlyRevenueData.map((data, index) => {
                  const maxRevenue = Math.max(...stats.monthlyRevenueData.map(d => d.revenue));
                  const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div 
                      key={index} 
                      className="flex-1 bg-gradient-to-t from-[#007EF4] to-[#00C1F4] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer" 
                      style={{height: `${Math.max(height, 5)}%`}}
                      title={`${data.month}: $${data.revenue.toLocaleString()}`}
                    ></div>
                  );
                })
              ) : (
                [65, 45, 78, 52, 89, 67, 95, 73, 88, 92, 85, 98].map((height, index) => (
                  <div key={index} className="flex-1 bg-gradient-to-t from-[#007EF4] to-[#00C1F4] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer" style={{height: `${height}%`}}></div>
                ))
              )}
            </div>
            <div className="flex justify-between mt-4 text-xs text-[#737791]">
              {stats.monthlyRevenueData?.length > 0 ? (
                stats.monthlyRevenueData.map((data, index) => (
                  <span key={index}>{data.month}</span>
                ))
              ) : (
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                  <span key={index}>{month}</span>
                ))
              )}
            </div>
          </div>
          
          {/* Case Types Chart */}
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-7">
            <div className="mb-6">
              <h3 className="text-[#181A2A] text-lg font-semibold mb-1">Case Distribution</h3>
              <p className="text-[#737791] text-sm">Cases by practice area</p>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full" style={{background: `conic-gradient(#007EF4 0deg 108deg, #16D959 108deg 180deg, #E6372B 180deg 252deg, #F5AB23 252deg 324deg, #737791 324deg 360deg)`}}></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-[#181A2A]">{stats.activeCases}</div>
                    <div className="text-xs text-[#737791]">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {stats.caseDistribution?.length > 0 ? (
                stats.caseDistribution.map((item, index) => {
                  const colors = ['#007EF4', '#16D959', '#E6372B', '#F5AB23', '#737791'];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors[index % colors.length]}}></div>
                        <span className="text-sm text-[#181A2A]">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium text-[#737791]">{item.count}</span>
                    </div>
                  );
                })
              ) : (
                [
                  { label: 'Civil', count: 5, color: '#007EF4' },
                  { label: 'Criminal', count: 3, color: '#16D959' },
                  { label: 'Family', count: 2, color: '#E6372B' },
                  { label: 'Corporate', count: 1, color: '#F5AB23' },
                  { label: 'Other', count: 1, color: '#737791' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                      <span className="text-sm text-[#181A2A]">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-[#737791]">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <QuickActions onSuccess={fetchDashboardData} />
            </React.Suspense>
          </div>

          {/* Professional Calendar */}
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-7">
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div className="text-center">
                <h2 className="text-[#181A2A] text-lg font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                <p className="text-[#737791] text-sm">Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={i} className="text-center py-2">
                    <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{day}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              {(() => {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
                
                const weeks = [];
                for (let week = 0; week < 6; week++) {
                  const weekDays = [];
                  for (let day = 0; day < 7; day++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + (week * 7) + day);
                    weekDays.push(date.getDate());
                  }
                  weeks.push(weekDays);
                }
                
                return weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((date, dateIndex) => {
                      const currentDate = new Date();
                      const isToday = date === currentDate.getDate() && 
                                     currentMonth === currentDate.getMonth() && 
                                     currentYear === currentDate.getFullYear();
                      const hasEvent = upcomingEvents.some(event => {
                        const eventDate = new Date(event.date + ', ' + currentYear);
                        return eventDate.getDate() === date && eventDate.getMonth() === currentMonth;
                      });
                      
                      return (
                        <div key={dateIndex} className="relative">
                          <button className={`w-full h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-[#F8F9FA] ${
                            isToday 
                              ? 'bg-[#007EF4] text-white shadow-md' 
                              : 'text-[#374151] hover:text-[#007EF4]'
                          }`}>
                            {date}
                          </button>
                          {hasEvent && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-1.5 h-1.5 bg-[#16D959] rounded-full"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
            
            {/* Upcoming Events */}
            <div className="mt-6 pt-6 border-t border-[#F8F9FA]">
              <h3 className="text-sm font-semibold text-[#374151] mb-3">Upcoming Events</h3>
              <div className="space-y-2">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event, index) => {
                    const colors = ['#007EF4', '#16D959', '#F5AB23'];
                    return (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: colors[index % colors.length]}}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#374151]">{event.title}</p>
                          <p className="text-xs text-[#6B7280]">{event.date}, {event.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-[#737791] text-sm py-4">
                    <p>No upcoming events</p>
                    <p className="text-xs mt-1">Events from database will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cases Management */}
        <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#181A2A] text-lg font-semibold">Cases Management</h2>
            <button 
              onClick={() => setShowCaseForm(!showCaseForm)} 
              className="flex items-center gap-2 bg-[#28B779] text-white px-4 py-2 rounded-lg hover:bg-[#229966] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Case
            </button>
          </div>

          {showCaseForm && (
            <div className="mb-6 p-4 border-2 border-[#DCE8FF] rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input 
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="Case Title" 
                  className="px-4 py-2 border border-[#DCE8FF] rounded-lg" 
                />
                <input 
                  value={caseClient}
                  onChange={(e) => setCaseClient(e.target.value)}
                  placeholder="Client Name (Optional)" 
                  className="px-4 py-2 border border-[#DCE8FF] rounded-lg" 
                />
                <select 
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="px-4 py-2 border border-[#DCE8FF] rounded-lg"
                >
                  <option value="civil">Civil</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family</option>
                  <option value="corporate">Corporate</option>
                  <option value="immigration">Immigration</option>
                  <option value="personal_injury">Personal Injury</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addCase} className="bg-[#28B779] text-white px-4 py-2 rounded-lg hover:bg-[#229966] transition-colors">Save</button>
                <button onClick={() => setShowCaseForm(false)} className="bg-[#F8F9FA] text-[#737791] px-4 py-2 rounded-lg hover:bg-[#E5E7EB] transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-[#737791]">Loading cases...</p>
            ) : cases.length === 0 ? (
              <p className="text-center text-[#737791]">No cases found. Add your first case!</p>
            ) : (
              cases.map((caseItem) => (
                <div key={caseItem.id} className="flex items-center justify-between p-4 border-2 border-[#DCE8FF] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h3 className="text-[#181A2A] text-base font-semibold">{caseItem.title}</h3>
                    <p className="text-[#737791] text-sm">{caseItem.case_number || `Case #${caseItem.id}`} - {caseItem.type} - Filed: {caseItem.filing_date || new Date(caseItem.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColors(caseItem.status)}`}>
                    {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Clients & Invoices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <h2 className="text-[#181A2A] text-lg font-semibold mb-4">Recent Clients</h2>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading...</p>
              ) : clients.length === 0 ? (
                <p className="text-center text-[#737791]">No clients found</p>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border border-[#F8F9FA] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EDF3FF] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#186898]" />
                      </div>
                      <div>
                        <p className="text-[#181A2A] font-medium">{client.name}</p>
                        <p className="text-[#737791] text-sm">{client.email}</p>
                      </div>
                    </div>
                    <button className="text-[#0086CB] text-sm font-medium hover:underline cursor-pointer">View</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <h2 className="text-[#181A2A] text-lg font-semibold mb-4">Recent Invoices</h2>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading...</p>
              ) : invoices.length === 0 ? (
                <p className="text-center text-[#737791]">No invoices found</p>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border border-[#F8F9FA] rounded-lg">
                    <div>
                      <p className="text-[#181A2A] font-medium">INV-{invoice.id}</p>
                      <p className="text-[#737791] text-sm">${(invoice.amount || 0).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInvoiceStatusColors(invoice.status)}`}>
                      {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#333] w-full px-4 md:px-6 lg:px-8 py-12 mt-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-base font-bold mb-6">Browse Our Site</h3>
              <ul className="space-y-2">
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white">Find a Lawyer</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Review Your Lawyer</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Legal Advice</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Recently Answered Questions</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Browse Practice Areas</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Avvo Stories Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-base font-bold mb-6">Popular Locations</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">New York City Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Los Angeles Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Chicago Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Houston Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Washington, DC Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Philadelphia Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Phoenix Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">San Antonio Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">San Diego Lawyers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-base font-bold mb-6">Popular Practice Areas</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Bankruptcy & Debt Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Business Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Criminal Defense Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">DUI & DWI Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Estate Planning Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Car Accident Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Divorce & Separation Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Intellectual Property Lawyers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Speeding & Traffic Lawyers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-base font-bold mb-6">About</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">About Avvo</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Careers</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Support</a></li>
                <li><a href="#" className="text-[#CCC] text-sm hover:text-white">Avvo Rating Explained</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#CCC]/20 pt-6 flex flex-wrap gap-4 items-center text-sm">
            <a href="#" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC]">Terms of Use</a>
            <a href="#" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC]">Privacy Policy</a>
            <a href="#" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC]">Do Not Sell or Share My Personal Information</a>
            <a href="#" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC]">Community Guidelines</a>
            <a href="#" className="text-[#CCC] hover:text-white">Sitemap</a>
          </div>

          <div className="mt-6">
            <p className="text-[#CCC] text-sm">© Avvo Inc. All Rights Reserved 2023</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateClientModal 
        isOpen={showClientModal} 
        onClose={() => setShowClientModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateEventModal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateTaskModal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateCaseModal 
        isOpen={showCaseModal} 
        onClose={() => setShowCaseModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateNoteModal 
        isOpen={showNoteModal} 
        onClose={() => setShowNoteModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <LogCallModal 
        isOpen={showCallModal} 
        onClose={() => setShowCallModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <SendMessageModal 
        isOpen={showMessageModal} 
        onClose={() => setShowMessageModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <TrackTimeModal 
        isOpen={showTimeModal} 
        onClose={() => setShowTimeModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <AddExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <CreateInvoiceModal 
        isOpen={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <RecordPaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        onSuccess={fetchDashboardData}
      />
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
      />
    </div>
  );
}