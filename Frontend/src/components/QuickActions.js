import React, { useState } from 'react';
import { Plus, Users, FileText, Calendar, CheckSquare, StickyNote, Phone, MessageSquare, Clock, DollarSign, Receipt, CreditCard, UserPlus, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import all modal components
import CreateClientModal from './modals/CreateClientModal';
import CreateContactModal from './modals/CreateContactModal';
import CreateMatterModal from './modals/CreateMatterModal';
import CreateEventModal from './modals/CreateEventModal';
import CreateTaskModal from './modals/CreateTaskModal';
import CreateNoteModal from './modals/CreateNoteModal';
import CreateCallModal from './modals/CreateCallModal';
import SendMessageModal from './modals/SendMessageModal';
import TrackTimeModal from './modals/TrackTimeModal';
import AddExpenseModal from './modals/AddExpenseModal';
import CreateInvoiceModal from './modals/CreateInvoiceModal';
import CreatePaymentModal from './modals/CreatePaymentModal';
import CreateIntakeModal from './modals/CreateIntakeModal';

export default function QuickActions({ onSuccess }) {
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const quickActions = [
    { id: 'client', label: 'New Client', icon: Users, color: 'bg-blue-500' },
    { id: 'contact', label: 'New Contact', icon: UserPlus, color: 'bg-green-500' },
    { id: 'matter', label: 'New Matter', icon: FileText, color: 'bg-purple-500' },
    { id: 'event', label: 'New Event', icon: Calendar, color: 'bg-orange-500' },
    { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-red-500' },
    { id: 'note', label: 'New Note', icon: StickyNote, color: 'bg-yellow-500' },
    { id: 'call', label: 'Log Call', icon: Phone, color: 'bg-indigo-500' },
    { id: 'message', label: 'Send Message', icon: MessageSquare, color: 'bg-pink-500' },
    { id: 'time', label: 'Track Time', icon: Clock, color: 'bg-teal-500' },
    { id: 'expense', label: 'Add Expense', icon: DollarSign, color: 'bg-emerald-500' },
    { id: 'invoice', label: 'New Invoice', icon: Receipt, color: 'bg-cyan-500' },
    { id: 'payment', label: 'Record Payment', icon: CreditCard, color: 'bg-violet-500' },
    { id: 'intake', label: 'New Intake', icon: Plus, color: 'bg-rose-500' },
    { id: 'qa', label: 'Answer Q&A', icon: HelpCircle, color: 'bg-blue-600' }
  ];

  const handleActionClick = (actionId) => {
    if (actionId === 'qa') {
      navigate('/lawyer/qa-answers');
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
      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6">
        <h2 className="text-[#181A2A] text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className="bg-white text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-2 min-h-[80px] border border-gray-200 shadow-sm"
              >
                <IconComponent className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium text-center leading-tight text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateClientModal 
        isOpen={activeModal === 'client'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
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
      <SendMessageModal 
        isOpen={activeModal === 'message'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <TrackTimeModal 
        isOpen={activeModal === 'time'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <AddExpenseModal 
        isOpen={activeModal === 'expense'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateInvoiceModal 
        isOpen={activeModal === 'invoice'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreatePaymentModal 
        isOpen={activeModal === 'payment'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
      <CreateIntakeModal 
        isOpen={activeModal === 'intake'} 
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess}
      />
    </>
  );
}