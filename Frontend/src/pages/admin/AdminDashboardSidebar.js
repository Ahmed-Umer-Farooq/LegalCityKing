import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users, UserCheck, UserX, Briefcase, CheckCircle, 
  XCircle, Trash2, Shield, ShieldOff, RefreshCw,
  TrendingUp, Activity, Clock, Search, ChevronLeft, ChevronRight,
  FileText, Eye, Edit, MessageCircle, Flag, AlertTriangle, Phone
} from 'lucide-react';

// Import the original dashboard component
import AdminDashboard from './AdminDashboard';

const AdminDashboardSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingReportsCount();
  }, []);

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
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full overflow-y-auto">
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
        <nav className="p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <TrendingUp className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'users' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button onClick={() => setActiveTab('lawyers')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'lawyers' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Briefcase className="w-5 h-5" />
            <span>Lawyers</span>
          </button>
          <button onClick={() => setActiveTab('blogs')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'blogs' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <FileText className="w-5 h-5" />
            <span>Blogs</span>
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'messages' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <MessageCircle className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'activity' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Activity className="w-5 h-5" />
            <span>Activity Logs</span>
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'security' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Shield className="w-5 h-5" />
            <span>Security Monitor</span>
          </button>
          <button onClick={() => setActiveTab('calls')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'calls' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Phone className="w-5 h-5" />
            <span>Voice Calls</span>
          </button>
          <button onClick={() => setActiveTab('qa')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'qa' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <AlertTriangle className="w-5 h-5" />
            <span>Q&A</span>
          </button>
          <button onClick={() => setActiveTab('forms')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'forms' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <FileText className="w-5 h-5" />
            <span>Forms</span>
          </button>
          <button onClick={() => { setActiveTab('reports'); setTimeout(fetchPendingReportsCount, 1000); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all relative ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Flag className="w-5 h-5" />
            <span>Reports</span>
            {pendingReportsCount > 0 && (
              <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingReportsCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('contact')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'contact' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <MessageCircle className="w-5 h-5" />
            <span>Contact Us</span>
          </button>
          <button onClick={() => navigate('/admin/platform-reviews')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            <Eye className="w-5 h-5" />
            <span>Platform Reviews</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm font-medium text-sm">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content - Render original dashboard with activeTab prop */}
      <div className="flex-1 ml-64">
        <AdminDashboard activeTabProp={activeTab} />
      </div>
    </div>
  );
};

export default AdminDashboardSidebar;
