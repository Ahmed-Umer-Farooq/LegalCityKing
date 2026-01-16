import React, { useState } from 'react';
import { Plus, Link, FileText, Calendar, CheckSquare, StickyNote, Phone, MessageSquare, Clock, DollarSign, Receipt, CreditCard, UserPlus, HelpCircle, BarChart3, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkFeatureAccess } from '../utils/restrictionChecker';
import { showToast } from '../utils/toastUtils';

// Import all modal components
import CreateContactModal from './modals/CreateContactModal.jsx';
import CreateMatterModal from './modals/CreateMatterModal.jsx';
import CreateEventModal from './modals/CreateEventModal.jsx';
import CreateTaskModal from './modals/CreateTaskModal.jsx';
import CreateNoteModal from './modals/CreateNoteModal.jsx';
import CreateCallModal from './modals/CreateCallModal.jsx';





export default function QuickActions({ onSuccess, lawyer }) {
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const quickActions = [
    { id: 'payment-links', label: 'Payment Links', icon: Link, color: 'bg-blue-500', featureName: 'payment_links' },
    { id: 'contact', label: 'New Contact', icon: UserPlus, color: 'bg-green-500', featureName: 'quick_actions' },
    { id: 'matter', label: 'New Matter', icon: FileText, color: 'bg-purple-500', featureName: 'quick_actions' },
    { id: 'event', label: 'New Event', icon: Calendar, color: 'bg-orange-500', featureName: 'quick_actions' },
    { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-red-500', featureName: 'quick_actions' },
    { id: 'note', label: 'New Note', icon: StickyNote, color: 'bg-yellow-500', featureName: 'quick_actions' },
    { id: 'call', label: 'Log Call', icon: Phone, color: 'bg-indigo-500', featureName: 'quick_actions' },


    { id: 'payment-records', label: 'Payment Records', icon: CreditCard, color: 'bg-violet-500', featureName: 'payment_records' },
    { id: 'reports', label: 'View Reports', icon: BarChart3, color: 'bg-indigo-600', featureName: 'reports' },
    { id: 'qa', label: 'Q&A Answers', icon: HelpCircle, color: 'bg-blue-600', featureName: 'qa_answers' }
  ];

  const handleActionClick = (action) => {
    // Check if feature is restricted
    const accessCheck = checkFeatureAccess(action.featureName || action.id, lawyer);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'admin_locked') {
        showToast.error('This feature has been restricted by the administrator. Please contact support.');
      } else if (accessCheck.reason === 'verification_required') {
        showToast.error('This feature requires account verification.');
      } else if (accessCheck.reason === 'subscription_required') {
        showToast.error(`This feature requires a ${accessCheck.requiredTier === 'premium' ? 'Premium' : 'Professional'} subscription.`);
      }
      return;
    }

    // Navigate or open modal
    if (action.id === 'qa') {
      navigate('/lawyer-dashboard?tab=qa');
    } else if (action.id === 'message') {
      navigate('/lawyer-dashboard?tab=messages');
    } else if (action.id === 'reports') {
      navigate('/lawyer-dashboard?tab=reports');
    } else if (action.id === 'payment-records') {
      navigate('/lawyer-dashboard?tab=payment-records');
    } else if (action.id === 'payment-links') {
      navigate('/lawyer-dashboard?tab=payment-links');
    } else {
      setActiveModal(action.id);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleModalSuccess = () => {
    setActiveModal(null);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <div>
        <h2 className="text-[#181A2A] text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            const accessCheck = checkFeatureAccess(action.featureName || action.id, lawyer);
            const isRestricted = !accessCheck.allowed;
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`bg-white text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-3 h-[100px] border border-gray-200 shadow-sm relative ${
                  isRestricted ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                disabled={isRestricted}
              >
                <IconComponent className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium text-center leading-tight text-gray-700">{action.label}</span>
                {isRestricted && (
                  <div className="absolute top-1 right-1">
                    <Lock className="w-3 h-3 text-red-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateContactModal 
        isOpen={activeModal === 'contact'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateMatterModal 
        isOpen={activeModal === 'matter'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateEventModal 
        isOpen={activeModal === 'event'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateTaskModal 
        isOpen={activeModal === 'task'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateNoteModal 
        isOpen={activeModal === 'note'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateCallModal 
        isOpen={activeModal === 'call'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />




    </>
  );
}