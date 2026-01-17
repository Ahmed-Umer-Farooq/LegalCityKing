import React, { useState, useEffect } from 'react';
import { Plus, Link, FileText, Calendar, CheckSquare, StickyNote, Phone, MessageSquare, Clock, DollarSign, Receipt, CreditCard, UserPlus, HelpCircle, BarChart3, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkFeatureAccess } from '../utils/restrictionChecker';
import { showToast } from '../utils/toastUtils';
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsageCounter from './UsageCounter';

// Import all modal components
import CreateContactModal from './modals/CreateContactModal.jsx';
import CreateMatterModal from './modals/CreateMatterModal.jsx';
import CreateEventModal from './modals/CreateEventModal.jsx';
import CreateTaskModal from './modals/CreateTaskModal.jsx';
import CreateNoteModal from './modals/CreateNoteModal.jsx';
import CreateCallModal from './modals/CreateCallModal.jsx';

export default function QuickActions({ onSuccess, lawyer }) {
  const [activeModal, setActiveModal] = useState(null);
  const [accessChecks, setAccessChecks] = useState({});
  const navigate = useNavigate();
  const { usage, limits, checkLimit, refreshUsage } = useUsageTracking(lawyer);

  const quickActions = [
    { id: 'payment-links', label: 'Payment Links', icon: Link, color: 'bg-blue-500', featureName: 'payment_links', resource: 'payment_links' },
    { id: 'contact', label: 'New Contact', icon: UserPlus, color: 'bg-green-500', featureName: 'quick_actions', resource: 'clients' },
    { id: 'matter', label: 'New Matter', icon: FileText, color: 'bg-purple-500', featureName: 'quick_actions', resource: 'cases' },
    { id: 'event', label: 'New Event', icon: Calendar, color: 'bg-orange-500', featureName: 'quick_actions' },
    { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-red-500', featureName: 'quick_actions' },
    { id: 'note', label: 'New Note', icon: StickyNote, color: 'bg-yellow-500', featureName: 'quick_actions', resource: 'documents' },
    { id: 'call', label: 'Log Call', icon: Phone, color: 'bg-indigo-500', featureName: 'quick_actions' },
    { id: 'payment-records', label: 'Payment Records', icon: CreditCard, color: 'bg-violet-500', featureName: 'payment_records' },
    { id: 'reports', label: 'View Reports', icon: BarChart3, color: 'bg-indigo-600', featureName: 'reports' },
    { id: 'qa', label: 'Q&A Answers', icon: HelpCircle, color: 'bg-blue-600', featureName: 'qa_answers', resource: 'qa_answers' }
  ];

  useEffect(() => {
    if (!lawyer) return;
    
    const checkAllFeatures = async () => {
      const checks = {};
      for (const action of quickActions) {
        try {
          const result = await checkFeatureAccess(action.featureName || action.id, lawyer);
          checks[action.id] = result;
        } catch (error) {
          checks[action.id] = { allowed: true };
        }
      }
      setAccessChecks(checks);
    };
    
    checkAllFeatures();
  }, [lawyer]);

  const handleActionClick = async (action) => {
    const accessCheck = accessChecks[action.id] || { allowed: true };
    
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

    // Check usage limits for resource-based actions
    if (action.resource) {
      const limitCheck = checkLimit(action.resource);
      if (!limitCheck.allowed) {
        showToast.error(`Usage limit reached (${limitCheck.usage}/${limitCheck.limit}). Upgrade your plan to continue.`);
        return;
      }
    }

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
    refreshUsage(); // Refresh usage counters after successful action
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <div>
        <h2 className="text-[#181A2A] text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            const accessCheck = accessChecks[action.id] || { allowed: true, loading: true };
            const isRestricted = !accessCheck.allowed && !accessCheck.loading;
            const limitCheck = action.resource ? checkLimit(action.resource) : { allowed: true };
            const isAtLimit = action.resource && !limitCheck.allowed;
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`bg-white text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-3 h-[100px] border border-gray-200 shadow-sm relative ${
                  isRestricted || isAtLimit ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                disabled={isRestricted || isAtLimit}
              >
                <IconComponent className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium text-center leading-tight text-gray-700">{action.label}</span>
                {action.resource && (
                  <UsageCounter 
                    resource={action.resource}
                    usage={limitCheck.usage || 0}
                    limit={limitCheck.limit}
                    className="absolute bottom-1 left-1 right-1"
                  />
                )}
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