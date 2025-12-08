import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { navigateToDashboard } from '../../utils/dashboardRedirect';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToDashboard = () => {
    navigateToDashboard(navigate, user);
  };

  return (
    <header className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-[#0284C7] font-bold text-lg tracking-tight">Legal</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">City</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;