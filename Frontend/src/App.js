import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

import LegalCityAuth from './LegalCityAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import GoogleUserSetup from './pages/auth/GoogleUserSetup';
import GoogleLawyerSetup from './pages/auth/GoogleLawyerSetup';
import LawyerDirectory from './pages/public/LawyerDirectory';
import LawyerProfile from './pages/LawyerProfile';
import AuthorProfile from './pages/AuthorProfile';
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import FindLawyer from './pages/FindLawyer';
import SearchResults from './pages/SearchResults';
import UserDashboard from './pages/userdashboard/UserDashboard';
import UserInterface from './pages/UserInterface';
import SharedLayout from './components/layout/SharedLayout';
import MainLayout from './components/layout/MainLayout';
import Blog from './pages/userdashboard/Blog';
import BlogPage from './pages/Blogs/blogs';
import BlogDetail from './pages/Blogs/BlogDetail';
import BlogPosts from './pages/userdashboard/BlogPosts';
import Messages from './pages/userdashboard/Messages';
import Directory from './pages/userdashboard/Directory';
import Forms from './pages/userdashboard/Forms';
import SocialMedia from './pages/userdashboard/SocialMedia';
import Tasks from './pages/userdashboard/Tasks';
import Cases from './pages/userdashboard/Cases';
import Dashboard from './pages/userdashboard/Dashboard';
import Accounting from './pages/userdashboard/Accounting';
import Profile from './pages/userdashboard/Profile';
import Calendar from './pages/userdashboard/Calendar';
import QA from './pages/userdashboard/QA';
import ChatPage from './pages/userdashboard/ChatPage';
import Refer from './pages/userdashboard/Refer';
import Settings from './pages/userdashboard/Settings';
import Logout from './pages/auth/Logout';
import LegalForms from './pages/LegalForms';
import QAPage from './pages/public/QAPage';
import ContactUs from './pages/ContactUs';

// Redirect component for legacy blog routes
const BlogRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/legal-blog/${id}`} replace />;
};

function App() {
  return (
    <div className="App">
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        duration={2000}
        toastOptions={{
          style: {
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      <Routes>
        {/* Auth routes - No header/footer */}
        <Route path="/login" element={<LegalCityAuth />} />
        <Route path="/register" element={<LegalCityAuth />} />
        <Route path="/forgot-password" element={<LegalCityAuth />} />
        <Route path="/reset-password" element={<LegalCityAuth />} />
        <Route path="/verify-email" element={<LegalCityAuth />} />
        <Route path="/google-user-setup" element={<GoogleUserSetup />} />
        <Route path="/google-lawyer-setup" element={<GoogleLawyerSetup />} />
        <Route path="/logout" element={<Logout />} />
        
        {/* Dashboard routes - No header/footer */}
        <Route path="/lawyer-dashboard" element={<ProtectedRoute><LawyerDashboard /></ProtectedRoute>} />
        <Route path="/lawyer-dashboard/chatapp" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        
        {/* SEO-Friendly User Dashboard Routes */}
        <Route element={<ProtectedRoute><SharedLayout /></ProtectedRoute>}>

          <Route path="/user/legal-blog" element={<BlogPage />} />
          <Route path="/user/legal-blog/:id/:slug?" element={<BlogDetail />} />
          <Route path="/user/legal-blog/:id" element={<BlogDetail />} />
          <Route path="/dashboard/my-blog-posts" element={<BlogPosts />} />
          <Route path="/user/messages" element={<Messages />} />
          <Route path="/user/chat" element={<Messages />} />
          <Route path="/user/lawyer-directory" element={<Directory />} />
          <Route path="/user/legal-forms" element={<Forms />} />
          <Route path="/user/social-media-management" element={<SocialMedia />} />
          <Route path="/user/legal-tasks" element={<Tasks />} />
          <Route path="/user/legal-cases" element={<Cases />} />
          <Route path="/user/accounting-billing" element={<Accounting />} />
          <Route path="/user/profile-settings" element={<Profile />} />
          <Route path="/user/calendar-appointments" element={<Calendar />} />
          <Route path="/user/legal-questions-answers" element={<QA />} />
          <Route path="/user/referral-program" element={<Refer />} />
          <Route path="/user/account-settings" element={<Settings />} />
        </Route>
        

        
        {/* Admin Blog Routes - No header/footer for admin */}
        <Route path="/admin-blogs" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
        <Route path="/admin/legal-blog/:id/:slug?" element={<ProtectedRoute><BlogDetail /></ProtectedRoute>} />
        <Route path="/admin/legal-blog/:id" element={<ProtectedRoute><BlogDetail /></ProtectedRoute>} />
        
        {/* Public pages with Main Layout (Header + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<UserInterface />} />
          <Route path="/lawyers" element={<LawyerDirectory />} />
          <Route path="/lawyer-directory" element={<LawyerDirectory />} />
          <Route path="/find-a-lawyer" element={<FindLawyer />} />
          <Route path="/lawyer/:id/:name?" element={<LawyerProfile />} />
          <Route path="/author/:authorName" element={<AuthorProfile />} />
          <Route path="/legal-blog" element={<BlogPage />} />
          <Route path="/legal-blog/:id/:slug?" element={<BlogDetail />} />
          <Route path="/legal-blog/:id" element={<BlogDetail />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/legal-forms" element={<LegalForms />} />
          <Route path="/qa" element={<QAPage />} />
          <Route path="/contact-us" element={<ContactUs />} />
          {/* Legacy redirects */}
          <Route path="/find-lawyer" element={<Navigate to="/find-a-lawyer" replace />} />
          <Route path="/blogs" element={<Navigate to="/legal-blog" replace />} />
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;