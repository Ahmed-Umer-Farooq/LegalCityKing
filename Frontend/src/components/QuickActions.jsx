import React, { useState } from 'react';
import { Plus, Link, FileText, Calendar, CheckSquare, StickyNote, Phone, MessageSquare, Clock, DollarSign, Receipt, CreditCard, UserPlus, HelpCircle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import all modal components
import CreateContactModal from './modals/CreateContactModal.jsx';
import CreateMatterModal from './modals/CreateMatterModal.jsx';
import CreateEventModal from './modals/CreateEventModal.jsx';
import CreateTaskModal from './modals/CreateTaskModal.jsx';
import CreateNoteModal from './modals/CreateNoteModal.jsx';
import CreateCallModal from './modals/CreateCallModal.jsx';





export default function QuickActions({ onSuccess }) {
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const quickActions = [
    { id: 'payment-links', label: 'Payment Links', icon: Link, color: 'bg-blue-500' },
    { id: 'contact', label: 'New Contact', icon: UserPlus, color: 'bg-green-500' },
    { id: 'matter', label: 'New Matter', icon: FileText, color: 'bg-purple-500' },
    { id: 'event', label: 'New Event', icon: Calendar, color: 'bg-orange-500' },
    { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-red-500' },
    { id: 'note', label: 'New Note', icon: StickyNote, color: 'bg-yellow-500' },
    { id: 'call', label: 'Log Call', icon: Phone, color: 'bg-indigo-500' },


    { id: 'payment-records', label: 'Payment Records', icon: CreditCard, color: 'bg-violet-500' },
    { id: 'reports', label: 'View Reports', icon: BarChart3, color: 'bg-indigo-600' },
    { id: 'qa', label: 'Q&A Answers', icon: HelpCircle, color: 'bg-blue-600' }
  ];

  const handleActionClick = (actionId) => {
    if (actionId === 'qa') {
      navigate('/lawyer-dashboard?tab=qa');
    } else if (actionId === 'message') {
      navigate('/lawyer-dashboard?tab=messages');
    } else if (actionId === 'reports') {
      navigate('/lawyer-dashboard?tab=reports');
    } else if (actionId === 'payment-records') {
      navigate('/lawyer-dashboard?tab=payment-records');
    } else if (actionId === 'payment-links') {
      navigate('/lawyer-dashboard?tab=payment-links');
    } else {
      setActiveModal(actionId);
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
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className="bg-white text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-3 h-[100px] border border-gray-200 shadow-sm"
              >
                <IconComponent className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium text-center leading-tight text-gray-700">{action.label}</span>
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