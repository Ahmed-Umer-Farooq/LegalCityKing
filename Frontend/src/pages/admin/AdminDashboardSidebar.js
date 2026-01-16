import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users, UserCheck, UserX, Briefcase, CheckCircle, 
  XCircle, Trash2, Shield, ShieldOff, RefreshCw,
  TrendingUp, Activity, Clock, Search, ChevronLeft, ChevronRight,
  FileText, Eye, Edit, MessageCircle, Flag, AlertTriangle, Phone,
  DollarSign, CreditCard, BarChart3, Settings, Database, 
  Calendar, FolderOpen, Mail, Star, HelpCircle, Building,
  Zap, Globe, Lock, Layers, PieChart, Target, Gauge
} from 'lucide-react';

// Import the original dashboard component
import AdminDashboard from './AdminDashboard';

const AdminDashboardSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function for navigation button classes
  const getNavButtonClasses = (tabName) => {
    return `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
      activeTab === tabName 
        ? 'bg-blue-50 text-blue-700 font-semibold' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;
  };

  useEffect(() => {
    fetchPendingReportsCount();
  }, []);

  // Sync activeTab with URL parameter
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchPendingReportsCount = async () => {
    try {
      const response = await api.get('/blogs/reports/count');
      setPendingReportsCount(response.data?.count || 0);
    } catch (error) {
      setPendingReportsCount(0);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Legal City</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {/* Core Management */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Core Management</p>
            <button onClick={() => handleTabChange('dashboard')} className={getNavButtonClasses('dashboard')}>
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button onClick={() => handleTabChange('users')} className={getNavButtonClasses('users')}>
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
            <button onClick={() => handleTabChange('lawyers')} className={getNavButtonClasses('lawyers')}>
              <Briefcase className="w-4 h-4" />
              <span>Lawyers</span>
            </button>
            <button onClick={() => handleTabChange('verification')} className={getNavButtonClasses('verification')}>
              <CheckCircle className="w-4 h-4" />
              <span>Verification</span>
            </button>
          </div>

          {/* Content Management */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Content</p>
            <button onClick={() => handleTabChange('blogs')} className={getNavButtonClasses('blogs')}>
              <FileText className="w-4 h-4" />
              <span>Blogs</span>
            </button>
            <button onClick={() => handleTabChange('qa')} className={getNavButtonClasses('qa')}>
              <HelpCircle className="w-4 h-4" />
              <span>Q&A</span>
            </button>
            <button onClick={() => handleTabChange('forms')} className={getNavButtonClasses('forms')}>
              <FolderOpen className="w-4 h-4" />
              <span>Legal Forms</span>
            </button>
            <button onClick={() => handleTabChange('reviews')} className={getNavButtonClasses('reviews')}>
              <Star className="w-4 h-4" />
              <span>Reviews</span>
            </button>
            <button onClick={() => { handleTabChange('reports'); setTimeout(fetchPendingReportsCount, 1000); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all text-sm ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className="flex items-center space-x-3">
                <Flag className="w-4 h-4" />
                <span>Reports</span>
              </div>
              {pendingReportsCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingReportsCount > 9 ? '9+' : pendingReportsCount}
                </span>
              )}
            </button>
          </div>

          {/* Communication */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Communication</p>
            <button onClick={() => handleTabChange('messages')} className={getNavButtonClasses('messages')}>
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </button>
            <button onClick={() => handleTabChange('calls')} className={getNavButtonClasses('calls')}>
              <Phone className="w-4 h-4" />
              <span>Voice Calls</span>
            </button>
            <button onClick={() => handleTabChange('contact')} className={getNavButtonClasses('contact')}>
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
            </button>
          </div>

          {/* Financial Management */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Financial</p>
            <button onClick={() => handleTabChange('connected-accounts')} className={getNavButtonClasses('connected-accounts')}>
              <Users className="w-4 h-4" />
              <span>Connected Accounts</span>
            </button>
            <button onClick={() => handleTabChange('payout-requests')} className={getNavButtonClasses('payout-requests')}>
              <CreditCard className="w-4 h-4" />
              <span>Payout Requests</span>
            </button>
            <button onClick={() => handleTabChange('platform-earnings')} className={getNavButtonClasses('platform-earnings')}>
              <DollarSign className="w-4 h-4" />
              <span>Platform Earnings</span>
            </button>
            <button onClick={() => handleTabChange('payments')} className={getNavButtonClasses('payments')}>
              <DollarSign className="w-4 h-4" />
              <span>Payments</span>
            </button>
            <button onClick={() => handleTabChange('subscriptions')} className={getNavButtonClasses('subscriptions')}>
              <CreditCard className="w-4 h-4" />
              <span>Subscriptions</span>
            </button>
            <button onClick={() => handleTabChange('financial-analytics')} className={getNavButtonClasses('financial-analytics')}>
              <BarChart3 className="w-4 h-4" />
              <span>Financial Analytics</span>
            </button>
          </div>

          {/* Business Intelligence */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Analytics</p>
            <button onClick={() => handleTabChange('business-intelligence')} className={getNavButtonClasses('business-intelligence')}>
              <PieChart className="w-4 h-4" />
              <span>Business Intelligence</span>
            </button>
            <button onClick={() => handleTabChange('system-metrics')} className={getNavButtonClasses('system-metrics')}>
              <Gauge className="w-4 h-4" />
              <span>System Metrics</span>
            </button>
            <button onClick={() => handleTabChange('user-behavior')} className={getNavButtonClasses('user-behavior')}>
              <Target className="w-4 h-4" />
              <span>User Behavior</span>
            </button>
          </div>

          {/* System Management */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">System</p>
            <button onClick={() => handleTabChange('activity')} className={getNavButtonClasses('activity')}>
              <Activity className="w-4 h-4" />
              <span>Activity Logs</span>
            </button>
            <button onClick={() => handleTabChange('platform-health')} className={getNavButtonClasses('platform-health')}>
              <Zap className="w-4 h-4" />
              <span>Platform Health</span>
            </button>
            <button onClick={() => handleTabChange('documents')} className={getNavButtonClasses('documents')}>
              <Database className="w-4 h-4" />
              <span>Documents</span>
            </button>
          </div>
        </nav>


      </aside>

      {/* Main Content - Render original dashboard with activeTab prop */}
      <div className="flex-1 ml-64">
        <AdminDashboard activeTabProp={activeTab} />
      </div>
    </div>
  );
};

export default AdminDashboardSidebar;
