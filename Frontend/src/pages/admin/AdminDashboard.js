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

// Lazy load BlogReports component
const BlogReports = React.lazy(() => import('./BlogReports'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLawyers: 0,
    verifiedLawyers: 0,
    unverifiedLawyers: 0,
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalComments: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentLawyers, setRecentLawyers] = useState([]);
  
  // Users management
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilter, setUsersFilter] = useState('all');
  
  // Lawyers management
  const [lawyers, setLawyers] = useState([]);
  const [lawyersPagination, setLawyersPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [lawyersSearch, setLawyersSearch] = useState('');
  const [lawyersFilter, setLawyersFilter] = useState('all');
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [logsSearch, setLogsSearch] = useState('');
  const [logsFilter, setLogsFilter] = useState('all'); // all, user_registration, lawyer_activity, chat_activity, blog_activity, report_activity
  
  // Blog management
  const [blogs, setBlogs] = useState([]);
  const [blogsPagination, setBlogsPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [blogsSearch, setBlogsSearch] = useState('');
  const [blogsFilter, setBlogsFilter] = useState('all');
  const [selectedBlogForComments, setSelectedBlogForComments] = useState(null);
  const [blogComments, setBlogComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Prevent browser back button
  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    
    // Push initial state
    preventBack();
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
      fetchPendingReportsCount();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'lawyers') {
      fetchLawyers();
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'blogs') {
      fetchBlogs();
    }
  }, [activeTab, usersPagination.page, lawyersPagination.page, logsPagination.page, blogsPagination.page]);

  // Auto-search when filters change
  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [usersSearch, usersFilter]);

  useEffect(() => {
    if (activeTab === 'lawyers') {
      const timeoutId = setTimeout(() => {
        fetchLawyers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [lawyersSearch, lawyersFilter]);

  useEffect(() => {
    if (activeTab === 'blogs') {
      const timeoutId = setTimeout(() => {
        fetchBlogs();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [blogsSearch, blogsFilter]);

  useEffect(() => {
    if (activeTab === 'activity') {
      const timeoutId = setTimeout(() => {
        fetchActivityLogs();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [logsSearch, logsFilter]);

  const refreshData = async () => {
    setRefreshing(true);
    if (activeTab === 'dashboard') {
      await fetchDashboardStats();
      await fetchPendingReportsCount();
    } else if (activeTab === 'users') {
      await fetchUsers();
    } else if (activeTab === 'lawyers') {
      await fetchLawyers();
    } else if (activeTab === 'activity') {
      await fetchActivityLogs();
    } else if (activeTab === 'blogs') {
      await fetchBlogs();
    }
    setRefreshing(false);
  };

  const fetchPendingReportsCount = async () => {
    try {
      const response = await api.get('/blogs/reports/count');
      setPendingReportsCount(response.data?.count || 0);
    } catch (error) {
      console.error('Error fetching pending reports count:', error);
      setPendingReportsCount(0);
    }
  };

  // Make refresh function available globally for child components
  useEffect(() => {
    window.refreshReportsCount = fetchPendingReportsCount;
    return () => {
      delete window.refreshReportsCount;
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints for comprehensive stats
      const [usersRes, lawyersRes, blogsRes] = await Promise.all([
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
        api.get('/admin/lawyers').catch(() => ({ data: { lawyers: [] } })),
        api.get('/blogs').catch(() => ({ data: [] }))
      ]);
      
      const users = usersRes.data?.users || [];
      const lawyers = lawyersRes.data?.lawyers || [];
      const blogs = Array.isArray(blogsRes.data) ? blogsRes.data : blogsRes.data?.data || [];
      
      const verifiedLawyers = lawyers.filter(l => l.lawyer_verified || l.is_verified || l.verified).length;
      const publishedBlogs = blogs.filter(b => b.status === 'published').length;
      const draftBlogs = blogs.filter(b => b.status === 'draft').length;
      
      setStats({
        totalUsers: users.length,
        totalLawyers: lawyers.length,
        verifiedLawyers,
        unverifiedLawyers: lawyers.length - verifiedLawyers,
        totalBlogs: blogs.length,
        publishedBlogs,
        draftBlogs,
        totalComments: blogs.reduce((sum, blog) => sum + (parseInt(blog.comment_count) || 0), 0)
      });
      
      setRecentUsers(users.slice(0, 5));
      setRecentLawyers(lawyers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({ totalUsers: 0, totalLawyers: 0, verifiedLawyers: 0, unverifiedLawyers: 0, totalBlogs: 0, publishedBlogs: 0, draftBlogs: 0, totalComments: 0 });
      setRecentUsers([]);
      setRecentLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users with filter:', usersFilter, 'search:', usersSearch);
      
      const response = await api.get('/admin/users', {
        params: {
          page: usersPagination.page,
          limit: usersPagination.limit,
          search: usersSearch || undefined,
          role: usersFilter === 'all' ? undefined : usersFilter
        }
      });
      
      console.log('Users API response:', response.data);
      
      let users = response.data?.users || [];
      
      // Client-side filtering as backup (remove when backend is fixed)
      if (usersFilter === 'admin') {
        users = users.filter(user => user.is_admin === 1 || user.role === 'admin');
      } else if (usersFilter === 'user') {
        users = users.filter(user => user.is_admin !== 1 && user.role !== 'admin');
      }
      
      setUsers(users);
      setUsersPagination(prev => ({ ...prev, total: users.length, totalPages: Math.ceil(users.length / prev.limit) }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      let verifiedParam;
      if (lawyersFilter === 'verified') {
        verifiedParam = 'true';
      } else if (lawyersFilter === 'unverified') {
        verifiedParam = 'false';
      }
      
      console.log('Fetching lawyers with filter:', lawyersFilter, 'verified param:', verifiedParam, 'search:', lawyersSearch);
      
      const response = await api.get('/admin/lawyers', {
        params: {
          page: lawyersPagination.page,
          limit: lawyersPagination.limit,
          search: lawyersSearch || undefined,
          verified: verifiedParam
        }
      });
      
      console.log('Lawyers API response:', response.data);
      
      let lawyers = response.data?.lawyers || [];
      
      // Client-side filtering as backup (remove when backend is fixed)
      if (lawyersFilter === 'verified') {
        lawyers = lawyers.filter(lawyer => lawyer.is_verified === 1 || lawyer.lawyer_verified === 1);
      } else if (lawyersFilter === 'unverified') {
        lawyers = lawyers.filter(lawyer => lawyer.is_verified === 0 && lawyer.lawyer_verified === 0);
      }
      
      setLawyers(lawyers);
      setLawyersPagination(prev => ({ ...prev, total: lawyers.length, totalPages: Math.ceil(lawyers.length / prev.limit) }));
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoading(true);
    console.log('fetchActivityLogs called with filter:', logsFilter);
    try {
      if (logsFilter === 'call_logs') {
        // Fetch all call history for admin
        console.log('Fetching call logs...');
        try {
          const response = await api.get('/admin/call-history');
          const calls = response.data || [];
          console.log('Call history API response:', calls);
          
          if (calls.length === 0) {
            console.log('No call history data found');
            setActivityLogs([]);
            return;
          }
          
          const formattedLogs = calls.map(call => ({
            id: call.id,
            event: `Voice Call: ${call.partner_name}`,
            user: `${call.user_type === 'lawyer' ? '⚖️' : '👤'} ${call.partner_name}`,
            details: `${call.call_type} call lasted ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')} minutes`,
            timestamp: new Date(call.created_at).toLocaleDateString(),
            status: 'success',
            type: 'call_logs'
          }));
          console.log('Formatted call logs:', formattedLogs);
          setActivityLogs(formattedLogs);
        } catch (error) {
          console.error('Error fetching call logs:', error);
          setActivityLogs([]);
        }
      } else {
        // Original working activity logs API
        const response = await api.get('/admin/activity-logs', {
          params: {
            page: logsPagination.page,
            limit: logsPagination.limit,
            type: logsFilter !== 'all' ? logsFilter : undefined
          }
        });
        
        const activities = response.data?.activities || [];
        const formattedLogs = activities.map(activity => ({
          id: activity.id,
          event: activity.event,
          user: activity.user,
          details: activity.details,
          timestamp: new Date(activity.timestamp).toLocaleDateString(),
          status: activity.status,
          type: activity.type
        }));
        
        setActivityLogs(formattedLogs);
        setLogsPagination(prev => ({ 
          ...prev, 
          total: response.data?.pagination?.total || 0,
          totalPages: response.data?.pagination?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    }
    setLoading(false);
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs', {
        params: {
          page: blogsPagination.page,
          limit: blogsPagination.limit,
          search: blogsSearch || undefined
        }
      });
      
      let blogs = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // Backend only returns published blogs, so handle filters accordingly
      if (blogsFilter === 'draft') {
        // No drafts available from this API endpoint
        blogs = [];
      }
      // If filter is 'published' or 'all', show all returned blogs (they're all published)
      
      setBlogs(blogs);
      setBlogsPagination(prev => ({ ...prev, total: blogs.length }));
    } catch (error) {
      console.error('Blogs API not available');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLawyer = async (lawyerId) => {
    try {
      await api.put(`/admin/verify-lawyer/${lawyerId}`);
      alert('Lawyer verified successfully');
      refreshData();
    } catch (error) {
      alert('Failed to verify lawyer');
    }
  };

  const handleRejectLawyer = async (lawyerId) => {
    if (!window.confirm('Are you sure you want to reject this lawyer?')) return;
    
    try {
      await api.put(`/admin/reject-lawyer/${lawyerId}`, {
        reason: 'Rejected by admin'
      });
      alert('Lawyer verification rejected');
      refreshData();
    } catch (error) {
      alert('Failed to reject lawyer');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      refreshData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    if (!window.confirm('Are you sure you want to delete this lawyer?')) return;
    
    try {
      await api.delete(`/admin/lawyers/${lawyerId}`);
      alert('Lawyer deleted successfully');
      refreshData();
    } catch (error) {
      alert('Failed to delete lawyer');
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to grant admin access to this user?')) return;
    
    try {
      await api.put(`/admin/users/${userId}/make-admin`);
      alert('Admin access granted successfully');
      refreshData();
    } catch (error) {
      alert('Failed to grant admin access');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to remove admin access?')) return;
    
    try {
      await api.put(`/admin/users/${userId}/remove-admin`);
      alert('Admin access removed successfully');
      refreshData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove admin access');
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await api.delete(`/blogs/${blogId}`);
      alert('Blog deleted successfully');
      refreshData();
    } catch (error) {
      alert('Failed to delete blog');
    }
  };
  
  const handleViewBlogComments = async (blog) => {
    setSelectedBlogForComments(blog);
    setLoadingComments(true);
    try {
      const response = await api.get(`/blogs/${blog.id}/comments`);
      setBlogComments(response.data || []);
    } catch (error) {
      console.error('Error fetching blog comments:', error);
      setBlogComments([]);
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await api.delete(`/blogs/comments/${commentId}/moderate`);
      alert('Comment deleted successfully');
      // Refresh comments
      if (selectedBlogForComments) {
        handleViewBlogComments(selectedBlogForComments);
      }
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Dashboard Stats View
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total Users</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">↗ +12% from last month</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total Lawyers</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalLawyers.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">↗ +8% from last month</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Verified Lawyers</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.verifiedLawyers.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{Math.round((stats.verifiedLawyers/stats.totalLawyers)*100)}% of total</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Pending Review</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.unverifiedLawyers.toLocaleString()}</div>
              <div className="text-xs text-amber-600 mt-1">Requires attention</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total Messages</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{allMessages.length.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Platform communication</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Active Conversations</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{Math.ceil(allMessages.length / 3)}</div>
              <div className="text-xs text-green-600 mt-1">User-Lawyer chats</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total Articles</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalBlogs.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Content library</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Published</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.publishedBlogs.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">Live content</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Edit className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Drafts</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.draftBlogs.toLocaleString()}</div>
              <div className="text-xs text-amber-600 mt-1">In progress</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Comments</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalComments.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">User engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              Recent Users
            </h3>
          </div>
          <div className="p-6">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent users</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verified Users */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
              Verified Users
            </h3>
          </div>
          <div className="p-6">
            {recentUsers.filter(user => user.verified || user.is_verified || user.status === 'verified').length === 0 ? (
              <p className="text-gray-500 text-center py-4">No verified users</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.filter(user => user.verified || user.is_verified || user.status === 'verified').map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Lawyers */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
              Recent Lawyers
            </h3>
          </div>
          <div className="p-6">
            {recentLawyers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent lawyers</p>
            ) : (
              <div className="space-y-4">
                {recentLawyers.map(lawyer => (
                  <div key={lawyer.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{lawyer.name}</p>
                      <p className="text-sm text-gray-500">{lawyer.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Users Management View
  const renderUsers = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <div className="flex items-center space-x-4">
            <select
              value={usersFilter}
              onChange={(e) => {
                setUsersFilter(e.target.value);
                setUsersPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="admin">Admin Users</option>
              <option value="user">Regular Users</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.name || 'Not provided'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.mobile_number || 'Not provided'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_admin || user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_admin || user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.verified || user.is_verified || user.status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.verified || user.is_verified || user.status === 'verified' ? 'Verified' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {!(user.is_admin || user.role === 'admin') && (
                        <button
                          onClick={() => handleMakeAdmin(user.id)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Make Admin"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      {(user.is_admin || user.role === 'admin') && user.id !== user.id && (
                        <button
                          onClick={() => handleRemoveAdmin(user.id)}
                          className="p-1 text-orange-600 hover:text-orange-800"
                          title="Remove Admin"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      )}
                      {!(user.is_admin || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {((usersPagination.page - 1) * usersPagination.limit) + 1} to{' '}
          {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of{' '}
          {usersPagination.total} users
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={usersPagination.page === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700">
            Page {usersPagination.page} of {usersPagination.totalPages || 1}
          </span>
          <button
            onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={usersPagination.page >= usersPagination.totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Lawyers Management View
  const renderLawyers = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Lawyer Management</h3>
          <div className="flex items-center space-x-4">
            <select
              value={lawyersFilter}
              onChange={(e) => {
                setLawyersFilter(e.target.value);
                setLawyersPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Lawyers</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Pending Only</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, registration ID, or specialty..."
                value={lawyersSearch}
                onChange={(e) => {
                  setLawyersSearch(e.target.value);
                  setLawyersPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchLawyers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speciality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : lawyers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No lawyers found
                </td>
              </tr>
            ) : (
              lawyers.map(lawyer => (
                <tr key={lawyer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{lawyer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{lawyer.name || 'Not provided'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lawyer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lawyer.registration_id || 'Not provided'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lawyer.speciality || 'Not provided'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {!(lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified) && (
                        <button
                          onClick={() => handleVerifyLawyer(lawyer.id)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Verify Lawyer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      {(lawyer.lawyer_verified || lawyer.is_verified || lawyer.verified) && (
                        <button
                          onClick={() => handleRejectLawyer(lawyer.id)}
                          className="p-1 text-yellow-600 hover:text-yellow-800"
                          title="Unverify Lawyer"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLawyer(lawyer.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete Lawyer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {((lawyersPagination.page - 1) * lawyersPagination.limit) + 1} to{' '}
          {Math.min(lawyersPagination.page * lawyersPagination.limit, lawyersPagination.total)} of{' '}
          {lawyersPagination.total} lawyers
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLawyersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={lawyersPagination.page === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700">
            Page {lawyersPagination.page} of {lawyersPagination.totalPages || 1}
          </span>
          <button
            onClick={() => setLawyersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={lawyersPagination.page >= lawyersPagination.totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Blog Management View
  const renderBlogs = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Blog Management</h3>
          <div className="flex items-center space-x-4">
            <select
              value={blogsFilter}
              onChange={(e) => {
                setBlogsFilter(e.target.value);
                setBlogsPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Blogs</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, author, or content..."
                value={blogsSearch}
                onChange={(e) => {
                  setBlogsSearch(e.target.value);
                  setBlogsPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchBlogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : blogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No blogs found
                </td>
              </tr>
            ) : (
              blogs.map(blog => (
                <tr key={blog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{blog.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{blog.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.author_name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.category || 'General'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {blog.comment_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      blog.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blog.status || 'Published'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewBlogComments(blog)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Comments"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/legal-blog/${blog.id}`)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="View Blog"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete Blog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Messages View
  const [allMessages, setAllMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState('all'); // all, lawyers, users
  const [messagePagination, setMessagePagination] = useState({ page: 1, limit: 20 });
  
  // Call tracking state
  const [activeCalls, setActiveCalls] = useState([]);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    todayCalls: 0,
    avgDuration: 0,
    recentCalls: []
  });
  const [socket, setSocket] = useState(null);

  const fetchAllMessages = async () => {
    setLoadingMessages(true);
    try {
      // Direct query to get all chat messages with user details
      const response = await api.get('/admin/chat-messages');
      
      const messages = response.data || [];
      setAllMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setAllMessages([]);
    }
    setLoadingMessages(false);
  };

  React.useEffect(() => {
    if (activeTab === 'messages') {
      fetchAllMessages();
    } else if (activeTab === 'calls') {
      initializeCallTracking();
    }
  }, [activeTab]);
  
  const initializeCallTracking = () => {
    // Connect to socket for real-time call updates
    const io = require('socket.io-client');
    const socketInstance = io('http://localhost:5001');
    setSocket(socketInstance);

    // Listen for call updates
    socketInstance.on('admin_call_update', (data) => {
      if (data.type === 'call_started' || data.type === 'call_ended') {
        fetchActiveCalls();
        fetchCallStats();
      }
    });

    fetchActiveCalls();
    fetchCallStats();

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  };

  const fetchActiveCalls = async () => {
    try {
      const response = await api.get('/admin/active-calls');
      setActiveCalls(response.data || []);
    } catch (error) {
      console.error('Error fetching active calls:', error);
      setActiveCalls([]);
    }
  };

  const fetchCallStats = async () => {
    try {
      const response = await api.get('/admin/call-stats');
      setCallStats(response.data || {
        totalCalls: 0,
        todayCalls: 0,
        avgDuration: 0,
        recentCalls: []
      });
    } catch (error) {
      console.error('Error fetching call stats:', error);
    }
  };
  
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallDuration = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    return Math.floor((now - start) / 1000);
  };

  const renderMessages = () => {
    // Filter messages based on search and filter
    const filteredMessages = allMessages.filter(msg => {
      const matchesSearch = !messageSearch || 
        msg.sender_name?.toLowerCase().includes(messageSearch.toLowerCase()) ||
        msg.receiver_name?.toLowerCase().includes(messageSearch.toLowerCase()) ||
        msg.message?.toLowerCase().includes(messageSearch.toLowerCase()) ||
        msg.content?.toLowerCase().includes(messageSearch.toLowerCase());
      
      const matchesFilter = messageFilter === 'all' || 
        (messageFilter === 'lawyers' && msg.sender_type === 'lawyer') ||
        (messageFilter === 'users' && msg.sender_type === 'user');
      
      return matchesSearch && matchesFilter;
    });

    // Paginate filtered messages
    const startIndex = (messagePagination.page - 1) * messagePagination.limit;
    const paginatedMessages = filteredMessages.slice(startIndex, startIndex + messagePagination.limit);
    const totalPages = Math.ceil(filteredMessages.length / messagePagination.limit);
    
    return (
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-gray-500" />
              Platform Messages ({filteredMessages.length})
            </h3>
            <button onClick={fetchAllMessages} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Refresh
            </button>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or message content..."
                value={messageSearch}
                onChange={(e) => {
                  setMessageSearch(e.target.value);
                  setMessagePagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={messageFilter}
              onChange={(e) => {
                setMessageFilter(e.target.value);
                setMessagePagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Messages</option>
              <option value="lawyers">Lawyer Messages</option>
              <option value="users">User Messages</option>
            </select>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {loadingMessages ? (
            <div className="p-8 text-center text-gray-500">
              Loading messages...
            </div>
          ) : paginatedMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {messageSearch || messageFilter !== 'all' ? 'No messages match your search' : 'No messages found'}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedMessages.map((msg, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            msg.sender_type === 'lawyer' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{msg.sender_name}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-600">{msg.receiver_name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            msg.sender_type === 'lawyer' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {msg.sender_type === 'lawyer' ? 'Lawyer' : 'User'}
                          </span>
                        </div>
                        <p className="text-gray-800 ml-5">{msg.message || msg.content}</p>
                      </div>
                      <div className="text-xs text-gray-400 ml-4">
                        {new Date(msg.created_at || msg.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + messagePagination.limit, filteredMessages.length)} of {filteredMessages.length} messages
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setMessagePagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={messagePagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {messagePagination.page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setMessagePagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={messagePagination.page >= totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Activity Logs View
  const renderActivityLogs = () => {
    // Filter activity logs
    const filteredLogs = activityLogs.filter(log => {
      const matchesSearch = !logsSearch || 
        log.event?.toLowerCase().includes(logsSearch.toLowerCase()) ||
        log.user?.toLowerCase().includes(logsSearch.toLowerCase()) ||
        log.details?.toLowerCase().includes(logsSearch.toLowerCase());
      
      const matchesFilter = logsFilter === 'all' || log.type === logsFilter;
      
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-gray-500" />
              Activity Logs ({filteredLogs.length})
            </h3>
            <button
              onClick={fetchActivityLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities by event, user, or details..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={logsFilter}
              onChange={(e) => setLogsFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Activities</option>
              <option value="user_registration">User Registrations</option>
              <option value="lawyer_activity">Lawyer Activities</option>
              <option value="chat_activity">Chat Activities</option>
              <option value="blog_activity">Blog Activities</option>
              <option value="report_activity">Report Activities</option>
              <option value="call_logs">Call Logs</option>
            </select>
          </div>
        </div>
      
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading activity logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>{logsSearch || logsFilter !== 'all' ? 'No activities match your search' : 'No recent activity found'}</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      log.status === 'success' ? 'bg-green-500' : 
                      log.status === 'pending' ? 'bg-yellow-500' : 
                      log.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{log.event}</span>
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                          log.type === 'user_registration' ? 'bg-blue-100 text-blue-800' :
                          log.type === 'lawyer_activity' ? 'bg-purple-100 text-purple-800' :
                          log.type === 'chat_activity' ? 'bg-green-100 text-green-800' :
                          log.type === 'blog_activity' ? 'bg-orange-100 text-orange-800' :
                          log.type === 'report_activity' ? 'bg-red-100 text-red-800' :
                          log.type === 'call_logs' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.type === 'call_logs' && <Phone className="w-3 h-3" />}
                          {log.type?.replace('_', ' ') || 'activity'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{log.details}</div>
                      <div className="text-xs text-gray-500">
                        User: {log.user}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  // Call Tracking View
  const renderCallTracking = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <Phone className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Calls</p>
              <p className="text-2xl font-bold text-gray-900">{activeCalls.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Calls</p>
              <p className="text-2xl font-bold text-gray-900">{callStats.todayCalls}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{callStats.totalCalls}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatCallDuration(callStats.avgDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Calls */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Active Calls ({activeCalls.length})
          </h3>
        </div>
        <div className="p-6">
          {activeCalls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active calls</p>
          ) : (
            <div className="space-y-4">
              {activeCalls.map((call, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {call.userName} ({call.userType}) ↔ {call.partnerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Active voice call
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCallDuration(getCallDuration(call.callStartTime))}
                    </p>
                    <p className="text-sm text-gray-500">
                      Started {new Date(call.callStartTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Calls</h3>
        </div>
        <div className="p-6">
          {callStats.recentCalls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent calls</p>
          ) : (
            <div className="space-y-3">
              {callStats.recentCalls.map((call, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {call.user_type === 'lawyer' ? '⚖️' : '👤'}
                        {call.partner_name}
                        <span className="text-xs text-gray-500">({call.user_type} → {call.partner_type})</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(call.created_at).toLocaleDateString()} at {new Date(call.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCallDuration(call.duration)}</p>
                    <p className="text-sm text-gray-500">{call.call_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Home
              </button>
              <span className="text-sm text-gray-600">Welcome, {user?.name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('lawyers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lawyers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Lawyers</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('blogs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blogs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Blogs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Activity Logs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Voice Calls</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                // Refresh count when clicking reports tab
                setTimeout(fetchPendingReportsCount, 1000);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Flag className="w-4 h-4" />
                <span>Reports</span>
                {pendingReportsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {pendingReportsCount}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'lawyers' && renderLawyers()}
        {activeTab === 'blogs' && renderBlogs()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'activity' && renderActivityLogs()}
        {activeTab === 'calls' && renderCallTracking()}
        {activeTab === 'reports' && (
          <Suspense fallback={<LoadingSpinner />}>
            <BlogReports />
          </Suspense>
        )}
        </main>
      </div>
      
      {/* Blog Comments Modal */}
      {selectedBlogForComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Comments for: {selectedBlogForComments.title}
              </h3>
              <button
                onClick={() => setSelectedBlogForComments(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading comments...</p>
                </div>
              ) : blogComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments found for this blog</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blogComments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {comment.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{comment.user_name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 ml-11">{comment.comment_text}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-red-600 hover:text-red-800 ml-4"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
};

export default AdminDashboard;