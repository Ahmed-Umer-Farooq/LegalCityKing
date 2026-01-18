import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Calendar, FileText, Mail, CreditCard, Users, DollarSign, File, ChevronLeft, ChevronRight, Home, UserCheck, BarChart3, CheckSquare, FolderOpen, MessageCircle, Save, X, Camera, Briefcase, Building, Globe, Lock, Settings, MapPin, Phone, Link, Brain, Menu, Crown } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';
import PaymentAcknowledgment from '../../components/PaymentAcknowledgment';
import RestrictedFeature from '../../components/RestrictedFeature';
import { checkFeatureAccess } from '../../utils/restrictionChecker';

// Lazy load components to prevent import errors
const QuickActions = React.lazy(() => import('../../components/QuickActions').catch(() => ({ default: () => <div>Quick Actions Loading...</div> })));
const CreateEventModal = React.lazy(() => import('../../components/modals/CreateEventModal').catch(() => ({ default: () => null })));
const CreateTaskModal = React.lazy(() => import('../../components/modals/CreateTaskModal').catch(() => ({ default: () => null })));
const CreateContactModal = React.lazy(() => import('../../components/modals/CreateContactModal').catch(() => ({ default: () => null })));
const CreateCaseModal = React.lazy(() => import('../../components/modals/CreateCaseModal').catch(() => ({ default: () => null })));
const CreateNoteModal = React.lazy(() => import('../../components/modals/CreateNoteModal').catch(() => ({ default: () => null })));
const LogCallModal = React.lazy(() => import('../../components/modals/LogCallModal').catch(() => ({ default: () => null })));
const RecordPaymentModal = React.lazy(() => import('../../components/modals/RecordPaymentModal').catch(() => ({ default: () => null })));
const VerificationModal = React.lazy(() => import('../../components/modals/VerificationModal').catch(() => ({ default: () => null })));
const ContactsPage = React.lazy(() => import('./ContactsPage.jsx').catch(() => ({ default: () => <div>Contacts coming soon...</div> })));
const CalendarPage = React.lazy(() => import('./CalendarPage.jsx').catch(() => ({ default: () => <div>Calendar loading...</div> })));
const ReportsPage = React.lazy(() => import('./ReportsPage').catch(() => ({ default: () => <div>Reports coming soon...</div> })));
const TasksPage = React.lazy(() => import('./TasksPage.jsx').catch(() => ({ default: () => <div>Tasks coming soon...</div> })));
const DocumentsPage = React.lazy(() => import('./DocumentsPage').catch(() => ({ default: () => <div>Documents coming soon...</div> })));
const BlogManagement = React.lazy(() => import('./BlogManagement').catch(() => ({ default: () => <div>Blog Management coming soon...</div> })));
const ChatPage = React.lazy(() => import('../../pages/userdashboard/ChatPage').catch(() => ({ default: () => <div>Chat coming soon...</div> })));
const QAAnswers = React.lazy(() => import('./QAAnswers').catch(() => ({ default: () => <div>Q&A coming soon...</div> })));
const FormsManagement = React.lazy(() => import('./FormsManagement').catch(() => ({ default: () => <div>Forms coming soon...</div> })));
const ProfileManagement = React.lazy(() => import('./ProfileManagement').catch(() => ({ default: () => <div>Profile Management loading...</div> })));
const PaymentLinkManager = React.lazy(() => import('../../components/payment/PaymentLinkManager').catch(() => ({ default: () => <div>Payment Links coming soon...</div> })));
const PaymentRecords = React.lazy(() => import('./PaymentRecords').catch(() => ({ default: () => <div>Payment Records loading...</div> })));
const PayoutsTab = React.lazy(() => import('../../components/LawyerDashboard/PayoutsTab').catch(() => ({ default: () => <div>Payouts loading...</div> })));

export default function LawyerDashboard() {
  const [cases, setCases] = useState([]);
  const [caseDisplayLimit, setCaseDisplayLimit] = useState(3);
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
  const [notes, setNotes] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeNavItem, setActiveNavItem] = useState(searchParams.get('tab') || 'home');
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [blogEngagementCount, setBlogEngagementCount] = useState(0);
  const [earnings, setEarnings] = useState({ total_earned: 0, available_balance: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscription feature checks
  const isProfessional = currentUser?.subscription_tier === 'professional' || currentUser?.subscription_tier === 'Professional';
  const isPremium = currentUser?.subscription_tier === 'premium' || currentUser?.subscription_tier === 'Premium';
  const hasAdvancedFeatures = isProfessional || isPremium;
  const isVerified = currentUser?.verification_status === 'approved' || currentUser?.is_verified === true || currentUser?.verified === true;

  console.log('🔍 Subscription Debug:', {
    subscription_tier: currentUser?.subscription_tier,
    subscription_status: currentUser?.subscription_status,
    isProfessional,
    isPremium,
    hasAdvancedFeatures,
    isVerified,
    verification_status: currentUser?.verification_status
  });


  // Handle URL parameter changes
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeNavItem) {
      setActiveNavItem(urlTab);
    }
  }, [searchParams]);

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
    fetchDashboardData();
    fetchUserProfile();
    
    // Listen for event modal open requests
    const handleOpenEventModal = () => {
      setShowEventModal(true);
    };
    
    // Listen for verification modal open requests
    const handleOpenVerificationModal = () => {
      setShowVerificationModal(true);
    };
    
    window.addEventListener('openEventModal', handleOpenEventModal);
    window.addEventListener('openVerificationModal', handleOpenVerificationModal);
    
    return () => {
      window.removeEventListener('openEventModal', handleOpenEventModal);
      window.removeEventListener('openVerificationModal', handleOpenVerificationModal);
    };
  }, []);

  // Refresh calendar data when events are created
  const refreshCalendarData = async () => {
    try {
      const [eventsRes, calendarRes] = await Promise.all([
        api.get('/events/upcoming'),
        api.get('/events/calendar')
      ]);
      setUpcomingEvents(Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : []);
      setCalendarEvents(Array.isArray(calendarRes.data?.data) ? calendarRes.data.data : []);
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    }
  };

  // Update fetchDashboardData to also refresh calendar
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, casesRes, notesRes, eventsRes, earningsRes, calendarRes, callsRes] = await Promise.all([
        api.get('/lawyer/dashboard/stats'),
        api.get('/lawyer/cases?page=1&limit=10'),
        api.get('/notes?page=1&limit=3'),
        api.get('/events/upcoming'),
        api.get('/stripe/lawyer-earnings'),
        api.get('/events/calendar'),
        api.get('/calls?page=1&limit=3').catch(() => ({ data: [] }))
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
      setNotes(Array.isArray(notesRes.data?.data) ? notesRes.data.data : []);
      setCalls(Array.isArray(callsRes.data) ? callsRes.data : (callsRes.data?.calls || callsRes.data?.data || []));
      setUpcomingEvents(Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : []);
      setCalendarEvents(Array.isArray(calendarRes.data?.data) ? calendarRes.data.data : []);
      
      // Set earnings data
      if (earningsRes.data) {
        setEarnings(earningsRes.data.earnings || { total_earned: 0, available_balance: 0 });
        setRecentPayments(earningsRes.data.recentTransactions || []);
      }
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

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      await api.put(`/cases/${caseId}`, { status: newStatus });
      showToast.success(`Case ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully`);
      fetchDashboardData();
    } catch (error) {
      showToast.error('Failed to update case status');
    }
  };

  const deleteCase = async (caseId) => {
    try {
      await api.delete(`/cases/${caseId}`);
      showToast.success('Case deleted successfully');
      fetchDashboardData();
    } catch (error) {
      showToast.error('Failed to delete case');
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
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-2 lg:gap-4 w-full">
            {/* Professional Logo/Brand */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              <div className="bg-[#0284C7] rounded-full px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 shadow-lg">
                <span className="text-white font-bold text-sm sm:text-base lg:text-xl tracking-tight">Legal</span>
              </div>
              <span className="text-[#0284C7] font-bold text-sm sm:text-base lg:text-xl tracking-tight">City</span>
            </div>
            
            {/* Navigation Sections */}
            {currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { id: 'home', label: 'Home', icon: Home, action: () => { setActiveNavItem('home'); setSearchParams({ tab: 'home' }); window.scrollTo(0, 0); } },
                { id: 'messages', label: 'Messages', icon: MessageCircle, action: () => { setActiveNavItem('messages'); setSearchParams({ tab: 'messages' }); }, showNotification: true, verificationRequired: !isVerified },
                { id: 'contacts', label: 'Contacts', icon: UserCheck, action: () => { setActiveNavItem('contacts'); setSearchParams({ tab: 'contacts' }); }, verificationRequired: !isVerified },
                { id: 'calendar', label: 'Calendar', icon: Calendar, action: () => { setActiveNavItem('calendar'); setSearchParams({ tab: 'calendar' }); }, verificationRequired: !isVerified },
                { id: 'payment-records', label: 'Payments', icon: DollarSign, action: () => { setActiveNavItem('payment-records'); setSearchParams({ tab: 'payment-records' }); }, verificationRequired: !isVerified },
                { id: 'payouts', label: 'Payouts', icon: CreditCard, action: () => { setActiveNavItem('payouts'); setSearchParams({ tab: 'payouts' }); }, verificationRequired: !isVerified },
                { id: 'payment-links', label: 'Pay Links', icon: Link, action: () => { setActiveNavItem('payment-links'); setSearchParams({ tab: 'payment-links' }); }, subscriptionRequired: !hasAdvancedFeatures, verificationRequired: !isVerified },
                { id: 'reports', label: 'Reports', icon: BarChart3, action: () => { setActiveNavItem('reports'); setSearchParams({ tab: 'reports' }); }, subscriptionRequired: !hasAdvancedFeatures, verificationRequired: !isVerified },
                { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => { setActiveNavItem('tasks'); setSearchParams({ tab: 'tasks' }); }, verificationRequired: !isVerified },
                { id: 'documents', label: 'Documents', icon: FolderOpen, action: () => { setActiveNavItem('documents'); setSearchParams({ tab: 'documents' }); }, verificationRequired: !isVerified },
                { id: 'ai-analyzer', label: 'AI Analyzer', icon: Brain, action: () => { window.location.href = '/lawyer-dashboard/ai-analyzer'; }, subscriptionRequired: !hasAdvancedFeatures, verificationRequired: !isVerified },
                { id: 'forms', label: 'Forms', icon: File, action: () => { setActiveNavItem('forms'); setSearchParams({ tab: 'forms' }); }, subscriptionRequired: !isPremium },
                { id: 'blogs', label: 'Blogs', icon: FileText, action: () => { setActiveNavItem('blogs'); setSearchParams({ tab: 'blogs' }); setBlogEngagementCount(0); }, showNotification: true, notificationCount: blogEngagementCount, subscriptionRequired: !hasAdvancedFeatures },
                { id: 'qa', label: 'Q&A', icon: Mail, action: () => { setActiveNavItem('qa'); setSearchParams({ tab: 'qa' }); }, verificationRequired: !isVerified },
                { id: 'subscription', label: 'Subscription', icon: CreditCard, action: () => { window.location.href = '/lawyer-dashboard/subscription'; } }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNavItem === item.id;
                
                // Check feature access if featureName is provided
                const accessCheck = item.featureName ? checkFeatureAccess(item.featureName, currentUser) : { allowed: true };
                const isRestricted = !accessCheck.allowed;
                const isAdminLocked = accessCheck.reason === 'admin_locked';
                const needsVerification = accessCheck.reason === 'verification_required';
                const needsSubscription = accessCheck.reason === 'subscription_required';
                
                return (
                  <button
                    key={item.id}
                    onClick={isRestricted ? (needsVerification ? () => setShowVerificationModal(true) : () => { window.location.href = '/lawyer-dashboard/subscription'; }) : (item.action || (() => { setActiveNavItem(item.id); setSearchParams({ tab: item.id }); }))}
                    className={`relative flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#EDF3FF] text-[#0086CB] shadow-sm' 
                        : 'text-[#181A2A] hover:text-[#0086CB] hover:bg-[#F8F9FA]'
                    } ${
                      isRestricted ? 'opacity-60' : ''
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:block text-xs">{item.label}</span>
                    {needsVerification && (
                      <Lock className="w-2.5 h-2.5 text-orange-500" />
                    )}
                    {needsSubscription && !needsVerification && (
                      <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[8px] px-1 rounded font-bold leading-none">PRO</span>
                    )}
                    {item.showNotification && (
                      item.id === 'messages' ? (
                        unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center text-[9px]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )
                      ) : item.id === 'blogs' ? (
                        blogEngagementCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center text-[9px]">
                            {blogEngagementCount > 9 ? '9+' : blogEngagementCount}
                          </span>
                        )
                      ) : null
                    )}
                  </button>
                );
              })}
            </nav>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors order-first"
            >
              <Menu className="w-5 h-5 text-[#374151]" />
            </button>
            
            {/* Professional User Profile */}
            <div className="relative group flex-shrink-0">
              <div className="flex items-center gap-2 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-lg px-2 py-1.5 border border-[#E5E7EB] transition-all">
                <div className="w-6 h-6 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-[#1F2937] text-xs font-medium truncate max-w-20">{currentUser?.name || 'User'}</div>
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
                  <button onClick={() => { setActiveNavItem('profile'); setSearchParams({ tab: 'profile' }); }} className="flex items-center gap-2 px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors w-full text-left">
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#181A2A]">Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#374151]" />
          </button>
        </div>
        <nav className="overflow-y-auto h-[calc(100%-73px)] p-4">
          <div className="space-y-2">
            {[
              { id: 'home', label: 'Home', icon: Home, action: () => { setActiveNavItem('home'); setSearchParams({ tab: 'home' }); window.scrollTo(0, 0); setIsMobileMenuOpen(false); } },
              { id: 'messages', label: 'Messages', icon: MessageCircle, action: () => { setActiveNavItem('messages'); setSearchParams({ tab: 'messages' }); setIsMobileMenuOpen(false); }, showNotification: true, featureName: 'messages' },
              { id: 'contacts', label: 'Contacts', icon: UserCheck, action: () => { setActiveNavItem('contacts'); setSearchParams({ tab: 'contacts' }); setIsMobileMenuOpen(false); }, featureName: 'contacts' },
              { id: 'calendar', label: 'Calendar', icon: Calendar, action: () => { setActiveNavItem('calendar'); setSearchParams({ tab: 'calendar' }); setIsMobileMenuOpen(false); }, featureName: 'calendar' },
              { id: 'payment-records', label: 'Payments', icon: DollarSign, action: () => { setActiveNavItem('payment-records'); setSearchParams({ tab: 'payment-records' }); setIsMobileMenuOpen(false); }, featureName: 'payment_records' },
              { id: 'payouts', label: 'Payouts', icon: CreditCard, action: () => { setActiveNavItem('payouts'); setSearchParams({ tab: 'payouts' }); setIsMobileMenuOpen(false); }, featureName: 'payouts' },
              { id: 'payment-links', label: 'Pay Links', icon: Link, action: () => { setActiveNavItem('payment-links'); setSearchParams({ tab: 'payment-links' }); setIsMobileMenuOpen(false); }, featureName: 'payment_links' },
              { id: 'reports', label: 'Reports', icon: BarChart3, action: () => { setActiveNavItem('reports'); setSearchParams({ tab: 'reports' }); setIsMobileMenuOpen(false); }, featureName: 'reports' },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => { setActiveNavItem('tasks'); setSearchParams({ tab: 'tasks' }); setIsMobileMenuOpen(false); }, featureName: 'tasks' },
              { id: 'documents', label: 'Documents', icon: FolderOpen, action: () => { setActiveNavItem('documents'); setSearchParams({ tab: 'documents' }); setIsMobileMenuOpen(false); }, featureName: 'documents' },
              { id: 'forms', label: 'Forms', icon: File, action: () => { setActiveNavItem('forms'); setSearchParams({ tab: 'forms' }); setIsMobileMenuOpen(false); }, featureName: 'forms' },
              { id: 'blogs', label: 'Blogs', icon: FileText, action: () => { setActiveNavItem('blogs'); setSearchParams({ tab: 'blogs' }); setBlogEngagementCount(0); setIsMobileMenuOpen(false); }, showNotification: true, notificationCount: blogEngagementCount, featureName: 'blogs' },
              { id: 'qa', label: 'Q&A', icon: Mail, action: () => { setActiveNavItem('qa'); setSearchParams({ tab: 'qa' }); setIsMobileMenuOpen(false); }, featureName: 'qa_answers' },
              { id: 'subscription', label: 'Subscription', icon: Crown, action: () => { window.location.href = '/lawyer-dashboard/subscription'; setIsMobileMenuOpen(false); } }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNavItem === item.id;
              
              // Check feature access if featureName is provided
              const accessCheck = item.featureName ? checkFeatureAccess(item.featureName, currentUser) : { allowed: true };
              const isRestricted = !accessCheck.allowed;
              const isAdminLocked = accessCheck.reason === 'admin_locked';
              const needsVerification = accessCheck.reason === 'verification_required';
              const needsSubscription = accessCheck.reason === 'subscription_required';
              
              return (
                <button
                  key={item.id}
                  onClick={isRestricted ? (isAdminLocked ? () => { showToast.error('This feature has been restricted by the administrator.'); setIsMobileMenuOpen(false); } : needsVerification ? () => { setShowVerificationModal(true); setIsMobileMenuOpen(false); } : () => { window.location.href = '/lawyer-dashboard/subscription'; setIsMobileMenuOpen(false); }) : item.action}
                  className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#EDF3FF] text-[#0086CB] shadow-sm' 
                      : 'text-[#181A2A] hover:text-[#0086CB] hover:bg-[#F8F9FA]'
                  } ${
                    isRestricted ? 'opacity-60' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isAdminLocked && (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                  {needsVerification && !isAdminLocked && (
                    <Lock className="w-4 h-4 text-orange-500" />
                  )}
                  {needsSubscription && !needsVerification && !isAdminLocked && (
                    <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">PRO</span>
                  )}
                  {item.showNotification && (
                    item.id === 'messages' ? (
                      unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )
                    ) : item.id === 'blogs' ? (
                      blogEngagementCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {blogEngagementCount > 9 ? '9+' : blogEngagementCount}
                        </span>
                      )
                    ) : null
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <main className="w-full px-4 md:px-6 lg:px-8 pb-16 pt-6 max-w-screen-2xl mx-auto">
        {activeNavItem === 'contacts' && (
          <RestrictedFeature featureName="contacts" lawyer={currentUser}>
            <ContactsPage />
          </RestrictedFeature>
        )}
        {activeNavItem === 'calendar' && (
          <RestrictedFeature featureName="calendar" lawyer={currentUser}>
            <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <CalendarPage />
            </React.Suspense>
          </RestrictedFeature>
        )}
        {activeNavItem === 'payment-links' && (
          <RestrictedFeature featureName="payment-links" lawyer={currentUser}>
            <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <PaymentLinkManager />
            </React.Suspense>
          </RestrictedFeature>
        )}
        {activeNavItem === 'payment-records' && (
          <RestrictedFeature featureName="payment-records" lawyer={currentUser}>
            <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <PaymentRecords />
            </React.Suspense>
          </RestrictedFeature>
        )}
        {activeNavItem === 'payouts' && (
          <RestrictedFeature featureName="payouts" lawyer={currentUser}>
            <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <PayoutsTab />
            </React.Suspense>
          </RestrictedFeature>
        )}
        {activeNavItem === 'reports' && (
          <RestrictedFeature featureName="reports" lawyer={currentUser}>
            <ReportsPage />
          </RestrictedFeature>
        )}
        {activeNavItem === 'tasks' && (
          <RestrictedFeature featureName="tasks" lawyer={currentUser}>
            <TasksPage />
          </RestrictedFeature>
        )}
        {activeNavItem === 'documents' && (
          <RestrictedFeature featureName="documents" lawyer={currentUser}>
            <DocumentsPage />
          </RestrictedFeature>
        )}
        {activeNavItem === 'forms' && (
          <RestrictedFeature featureName="forms" lawyer={currentUser}>
            <FormsManagement />
          </RestrictedFeature>
        )}
        {activeNavItem === 'blogs' && (
          <RestrictedFeature featureName="blogs" lawyer={currentUser}>
            <BlogManagement />
          </RestrictedFeature>
        )}
        {activeNavItem === 'messages' && (
          <RestrictedFeature featureName="messages" lawyer={currentUser}>
            <ChatPage key="lawyer-chat" />
          </RestrictedFeature>
        )}
        {activeNavItem === 'qa' && (
          <RestrictedFeature featureName="qa" lawyer={currentUser}>
            <QAAnswers />
          </RestrictedFeature>
        )}
        
        {activeNavItem === 'profile' && (
          <React.Suspense fallback={<div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
            <ProfileManagement />
          </React.Suspense>
        )}
        
        {activeNavItem === 'home' && (
        <>

        {/* Overview Stats */}
        <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-4 sm:p-5 lg:p-7 mb-4 lg:mb-6">
          <div className="mb-4 lg:mb-9">
            <h2 className="text-[#181A2A] text-base lg:text-[17px] font-semibold mb-1">Overview</h2>
            <p className="text-[#737791] text-xs lg:text-sm">Current Period Statistics</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-[#EBF5FF] to-[#E0EFFF] rounded-xl p-3 lg:p-4 relative overflow-hidden border border-[#B8DAFF]">
              <div className="w-7 h-7 lg:w-[34px] lg:h-[34px] bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-full mb-2 lg:mb-3 flex items-center justify-center shadow-md">
                <FileText className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <h3 className="text-[#0052A3] text-sm lg:text-xl font-semibold mb-1 lg:mb-2">Active Cases</h3>
              <p className="text-[#0052A3] text-lg lg:text-2xl font-bold mb-1">{stats.activeCases}</p>
              <div className="flex items-center text-xs">
                <span className={`font-medium ${
                  stats.percentageChanges?.activeCases >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.percentageChanges?.activeCases >= 0 ? '+' : ''}{stats.percentageChanges?.activeCases || 0}%
                </span>
                <span className="text-[#737791] ml-1 hidden sm:inline">from last month</span>
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 lg:w-16 lg:h-16 bg-[#0066CC]/10 rounded-full -mr-6 lg:-mr-8 -mb-6 lg:-mb-8"></div>
            </div>
            <div className="bg-gradient-to-br from-[#E8F8F0] to-[#D9F3E8] rounded-xl p-4 relative overflow-hidden border border-[#A7E6C8]">
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full mb-3 flex items-center justify-center shadow-md">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#047857] text-xl font-semibold mb-2">Total Clients</h3>
              <p className="text-[#047857] text-2xl font-bold mb-1">{stats.totalClients}</p>
              <div className="flex items-center text-xs">
                <span className={`font-medium ${
                  stats.percentageChanges?.totalClients >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.percentageChanges?.totalClients >= 0 ? '+' : ''}{stats.percentageChanges?.totalClients || 0}%
                </span>
                <span className="text-[#737791] ml-1">from last month</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#10B981]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
            <div className="bg-gradient-to-br from-[#F0F4FF] to-[#E5EDFF] rounded-xl p-4 relative overflow-hidden border border-[#C7D7FE]">
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-full mb-3 flex items-center justify-center shadow-md">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#4338CA] text-xl font-semibold mb-2">Total Earnings</h3>
              <p className="text-[#4338CA] text-2xl font-bold mb-1">${Number(earnings.total_earned || 0).toFixed(2)}</p>
              <div className="flex items-center text-xs">
                <span className="text-[#10B981] font-medium">Available: ${Number(earnings.available_balance || 0).toFixed(2)}</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#6366F1]/10 rounded-full -mr-8 -mb-8"></div>
            </div>
            <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] rounded-xl p-4 relative overflow-hidden border border-[#FED7AA]">
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-full mb-3 flex items-center justify-center shadow-md">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[#C2410C] text-xl font-semibold mb-2">Upcoming Hearings</h3>
              <p className="text-[#C2410C] text-2xl font-bold mb-1">{stats.upcomingHearings}</p>
              <div className="flex items-center text-xs">
                <span className="text-[#EA580C] font-medium">{Math.min(stats.upcomingHearings, 7)} this week</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#F97316]/10 rounded-full -mr-8 -mb-8"></div>
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
                <span className="text-sm text-[#737791]">{new Date().getFullYear()}</span>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {stats.monthlyRevenueData?.length > 0 ? (
                (() => {
                  // Reorder to start with January
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const reorderedData = months.map(month => 
                    stats.monthlyRevenueData.find(d => d.month === month) || { month, revenue: 0 }
                  );
                  const maxRevenue = Math.max(...reorderedData.map(d => d.revenue));
                  return reorderedData.map((data, index) => {
                    const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div 
                        key={index} 
                        className="flex-1 bg-gradient-to-t from-[#007EF4] to-[#00C1F4] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer" 
                        style={{height: `${Math.max(height, 5)}%`}}
                        title={`${data.month}: $${data.revenue.toLocaleString()}`}
                      ></div>
                    );
                  });
                })()
              ) : (
                [65, 45, 78, 52, 89, 67, 95, 73, 88, 92, 85, 98].map((height, index) => (
                  <div key={index} className="flex-1 bg-gradient-to-t from-[#007EF4] to-[#00C1F4] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer" style={{height: `${height}%`}}></div>
                ))
              )}
            </div>
            <div className="flex justify-between mt-4 text-xs text-[#737791]">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                <span key={index}>{month}</span>
              ))}
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
        <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-7 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="h-full">
              <React.Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded"></div>}>
                <QuickActions onSuccess={fetchDashboardData} lawyer={currentUser} />
              </React.Suspense>
            </div>

            {/* Professional Calendar */}
            <div className="h-full">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    const newDate = new Date(currentCalendarDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentCalendarDate(newDate);
                  }}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
                </button>
                <div className="text-center">
                  <h2 className="text-[#181A2A] text-lg font-semibold">{currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                  <p className="text-[#737791] text-sm">Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button 
                  onClick={() => {
                    const newDate = new Date(currentCalendarDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentCalendarDate(newDate);
                  }}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
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
                const currentMonth = currentCalendarDate.getMonth();
                const currentYear = currentCalendarDate.getFullYear();
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
                    weekDays.push({
                      date: date.getDate(),
                      fullDate: new Date(date),
                      isCurrentMonth: date.getMonth() === currentMonth
                    });
                  }
                  weeks.push(weekDays);
                }
                
                return weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((dayObj, dateIndex) => {
                      const currentDate = new Date();
                      const isToday = dayObj.date === currentDate.getDate() && 
                                     currentMonth === currentDate.getMonth() && 
                                     currentYear === currentDate.getFullYear() &&
                                     dayObj.isCurrentMonth;
                      
                      // Check for events on this date
                      const dayEvents = calendarEvents.filter(event => {
                        const eventDate = new Date(event.start_date_time);
                        return eventDate.getDate() === dayObj.date && 
                               eventDate.getMonth() === dayObj.fullDate.getMonth() &&
                               eventDate.getFullYear() === dayObj.fullDate.getFullYear();
                      });
                      
                      const hasEvent = dayEvents.length > 0;
                      
                      return (
                        <div key={dateIndex} className="relative">
                          <button 
                            className={`w-full h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-[#F8F9FA] ${
                              isToday 
                                ? 'bg-[#007EF4] text-white shadow-md' 
                                : dayObj.isCurrentMonth
                                  ? 'text-[#374151] hover:text-[#007EF4]'
                                  : 'text-[#9CA3AF]'
                            }`}
                            title={hasEvent ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''} - Click to view` : 'Click to add event'}
                            onClick={() => {
                              if (hasEvent) {
                                // Show events for this day
                                const eventList = dayEvents.map(e => `${e.title} (${new Date(e.start_date_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`).join('\n');
                                showToast.info(`Events on ${dayObj.fullDate.toLocaleDateString()}:\n\n${eventList}`);
                              } else {
                                // Open event creation modal with pre-selected date
                                setShowEventModal(true);
                              }
                            }}
                          >
                            {dayObj.date}
                          </button>
                          {hasEvent && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                              {dayEvents.slice(0, 3).map((event, i) => {
                                const eventColors = {
                                  hearing: 'bg-red-500',
                                  meeting: 'bg-blue-500',
                                  deadline: 'bg-orange-500',
                                  consultation: 'bg-green-500',
                                  court_date: 'bg-purple-500',
                                  other: 'bg-gray-500'
                                };
                                return (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full ${eventColors[event.event_type] || eventColors.other}`}
                                    title={event.title}
                                  ></div>
                                );
                              })}
                              {dayEvents.length > 3 && (
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" title={`+${dayEvents.length - 3} more`}></div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#F8F9FA] flex-1">
            </div>
            </div>
          </div>
        </div>

        {/* Cases Management & Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cases Management */}
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#181A2A] text-lg font-semibold">Cases Management</h2>
              <select 
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                value={caseDisplayLimit}
                onChange={(e) => setCaseDisplayLimit(e.target.value === 'all' ? cases.length : parseInt(e.target.value))}
              >
                <option value="3">Latest 3</option>
                <option value="5">Latest 5</option>
                <option value="10">Latest 10</option>
                <option value="all">See All</option>
              </select>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading cases...</p>
              ) : cases.length === 0 ? (
                <p className="text-center text-[#737791]">No cases found. Add your first case!</p>
              ) : (
                cases.slice(0, caseDisplayLimit).map((caseItem) => (
                  <div key={caseItem.id} className="p-3 border border-[#F8F9FA] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-[#181A2A] text-sm font-semibold mb-1">{caseItem.title}</h3>
                        <div className="text-[#737791] text-xs space-y-1">
                          <div>ID: {caseItem.case_number || `CASE-${caseItem.id}`}</div>
                          <div>Type: {caseItem.type?.replace('_', ' ')?.charAt(0).toUpperCase() + caseItem.type?.replace('_', ' ')?.slice(1) || 'Unknown'}</div>
                          <div>Filed: {caseItem.filing_date ? new Date(caseItem.filing_date).toLocaleDateString() : new Date(caseItem.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColors(caseItem.status)}`}>
                          {caseItem.status?.charAt(0).toUpperCase() + caseItem.status?.slice(1) || 'Active'}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => updateCaseStatus(caseItem.id, caseItem.status === 'active' ? 'closed' : 'active')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            {caseItem.status === 'active' ? 'Close' : 'Reopen'}
                          </button>
                          <button 
                            onClick={() => deleteCase(caseItem.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#181A2A] text-lg font-semibold">Recent Payments</h2>
              <div className="text-right">
                <p className="text-sm text-[#737791]">Total Earned</p>
                <p className="text-lg font-bold text-[#16D959]">${Number(earnings.total_earned || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading...</p>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-[#737791]">No payments received yet</p>
              ) : (
                recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-[#F8F9FA] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DCFCE7] rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#16D959]" />
                      </div>
                      <div>
                        <p className="text-[#181A2A] font-medium">{payment.description}</p>
                        <p className="text-[#737791] text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#16D959] font-semibold">${Number(payment.lawyer_earnings || payment.amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-[#737791]">Earned</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentPayments.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-[#0086CB] text-sm font-medium hover:underline">
                  View All Payments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes, Calls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#181A2A] text-lg font-semibold">Recent Notes</h2>
              <select 
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                onChange={(e) => {
                  const limit = e.target.value === 'all' ? 100 : parseInt(e.target.value);
                  api.get(`/notes?page=1&limit=${limit}`).then(res => {
                    setNotes(Array.isArray(res.data?.data) ? res.data.data : []);
                  }).catch(() => setNotes([]));
                }}
              >
                <option value="3">Recent (3)</option>
                <option value="all">All Notes</option>
              </select>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading...</p>
              ) : notes.length === 0 ? (
                <p className="text-center text-[#737791]">No notes found</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-3 border border-[#F8F9FA] rounded-lg">
                    <div>
                      <p className="text-[#181A2A] font-medium">{note.title}</p>
                      <p className="text-[#737791] text-sm">{note.content?.substring(0, 50)}{note.content?.length > 50 ? '...' : ''}</p>
                      <p className="text-[#9CA3AF] text-xs mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      note.is_private ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {note.is_private ? 'Private' : 'Shared'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#181A2A] text-lg font-semibold">Recent Calls</h2>
              <select 
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                onChange={(e) => {
                  const limit = e.target.value === 'all' ? 100 : parseInt(e.target.value);
                  api.get(`/calls?page=1&limit=${limit}`).then(res => {
                    setCalls(Array.isArray(res.data) ? res.data : (res.data?.calls || res.data?.data || []));
                  }).catch(() => setCalls([]));
                }}
              >
                <option value="3">Recent (3)</option>
                <option value="5">Last 5</option>
                <option value="all">All Calls</option>
              </select>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-[#737791]">Loading...</p>
              ) : calls.length === 0 ? (
                <p className="text-center text-[#737791]">No calls logged</p>
              ) : (
                calls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border border-[#F8F9FA] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#E5E7EB] rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-[#181A2A] font-medium">{call.call_type?.charAt(0).toUpperCase() + call.call_type?.slice(1) || 'Call'}</p>
                        <p className="text-[#737791] text-sm">{call.duration || 0} min • {new Date(call.created_at || call.scheduled_at).toLocaleDateString()}</p>
                        {call.notes && <p className="text-[#9CA3AF] text-xs mt-1">{call.notes.substring(0, 50)}{call.notes.length > 50 ? '...' : ''}</p>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      call.outcome === 'successful' ? 'bg-green-100 text-green-800' :
                      call.outcome === 'no_answer' ? 'bg-red-100 text-red-800' :
                      call.outcome === 'voicemail' ? 'bg-yellow-100 text-yellow-800' :
                      call.outcome === 'busy' ? 'bg-orange-100 text-orange-800' :
                      call.outcome === 'follow_up_needed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {call.outcome ? call.outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending'}
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
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#0284C7] rounded-full px-4 py-2 shadow-lg">
                  <span className="text-white font-bold text-xl tracking-tight">Legal</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">City</span>
              </div>
              <p className="text-[#CCC] text-sm mb-4">Connect with qualified legal professionals in your area. Find the right lawyer for your specific legal needs with our comprehensive directory.</p>
            </div>

            <div>
              <h3 className="text-white text-base font-bold mb-6">Pages</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-[#CCC] text-sm hover:text-white transition-colors">Home</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Find Lawyers</a></li>
                <li><a href="/legal-forms" className="text-[#CCC] text-sm hover:text-white transition-colors">Legal Forms</a></li>
                <li><a href="/qa" className="text-[#CCC] text-sm hover:text-white transition-colors">Q&A</a></li>
                <li><a href="/blog" className="text-[#CCC] text-sm hover:text-white transition-colors">Legal Blog</a></li>
                <li><a href="/contact" className="text-[#CCC] text-sm hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-base font-bold mb-6">Popular Cities</h3>
              <ul className="space-y-2">
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">New York Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Los Angeles Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Chicago Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Houston Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Phoenix Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Philadelphia Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">San Antonio Lawyers</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">San Diego Lawyers</a></li>
              </ul>
            </div>


            <div>
              <h3 className="text-white text-base font-bold mb-6">Legal Areas</h3>
              <ul className="space-y-2">
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Corporate Law</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Family Law</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Criminal Defense</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Personal Injury</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Real Estate</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Immigration</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Employment Law</a></li>
                <li><a href="/lawyers" className="text-[#CCC] text-sm hover:text-white transition-colors">Estate Planning</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#CCC]/20 pt-6 flex flex-wrap gap-4 items-center text-sm">
            <a href="/privacy-policy" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC] transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="text-[#CCC] hover:text-white pr-4 border-r border-[#CCC] transition-colors">Terms of Service</a>
            <a href="/contact" className="text-[#CCC] hover:text-white transition-colors">Contact</a>
          </div>

          <div className="mt-6">
            <p className="text-[#CCC] text-sm">© {new Date().getFullYear()} LegalCity. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Payment Acknowledgment Notifications */}
      <PaymentAcknowledgment onAcknowledged={fetchDashboardData} />

      {/* Modals */}
      <CreateEventModal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)} 
        onSuccess={() => {
          fetchDashboardData();
          refreshCalendarData();
        }}
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