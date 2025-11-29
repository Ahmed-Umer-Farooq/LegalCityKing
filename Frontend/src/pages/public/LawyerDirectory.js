import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { updatePageMeta, addStructuredData, seoConfigs, generateLawyerStructuredData } from '../../utils/seo';

// Default fallback data if API fails
const fallbackLawyers = [];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user came from dashboard
  const cameFromDashboard = location.state?.from === 'dashboard';

  const handleBackNavigation = () => {
    if (user && cameFromDashboard) {
      navigate('/user-dashboard');
    } else {
      navigate('/');
    }
  };

  // Check if coming from user dashboard
  const isFromUserDashboard = location.pathname.includes('/user/lawyer-directory') || location.state?.from === 'user-dashboard';

  return (
    <header className="w-full h-16 bg-gradient-to-b from-blue-600 to-cyan-400 flex items-center justify-between px-4 lg:px-36">
      <div className="flex items-center flex-shrink-0">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-[#0284C7] font-bold text-lg tracking-tight">Legal</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">City</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Admin Panel - Only show for admin users */}
        {user && (user.role === 'admin' || user.is_admin) && (
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="text-white hover:opacity-90 transition-opacity text-sm"
          >
            Admin Panel
          </button>
        )}

        {user ? (
          <>
            <button 
              onClick={handleBackNavigation}
              className="flex items-center justify-center h-9 px-4 md:px-7 rounded-full bg-white/20 text-white text-sm font-normal hover:bg-white/30 transition-colors"
            >
              {isFromUserDashboard ? 'Back to Dashboard' : 'Back to Home'}
            </button>
            {!isFromUserDashboard && (
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className="flex items-center justify-center h-9 px-4 md:px-7 rounded-full bg-white text-black text-sm font-normal hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center h-9 px-4 md:px-7 rounded-full bg-white text-black text-sm font-normal hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </button>
        )}
      </div>
    </header>
  );
}

function LawyerCard({
  id,
  name,
  location,
  rating,
  reviewCount,
  reviewScore,
  yearsLicensed,
  practiceAreas,
  description,
  imageUrl,
  category,
  fromDashboard = false
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleViewProfile = () => {
    if (fromDashboard) {
      navigate(`/dashboard/lawyer/${id}`);
    } else {
      navigate(`/lawyer/${id}`);
    }
  };

  const handleChatWithLawyer = () => {
    if (!user) {
      // Only allow chat from dashboard context
      if (fromDashboard) {
        localStorage.setItem('pendingChat', JSON.stringify({
          partner_id: id,
          partner_type: 'lawyer',
          partner_name: name
        }));
        toast.error('Please login to chat with lawyers');
        navigate('/login');
      } else {
        toast.error('Please login to access chat features');
        navigate('/login');
      }
    } else {
      // User is logged in, start chat
      localStorage.setItem('chatPartner', JSON.stringify({
        partner_id: id,
        partner_type: 'lawyer',
        partner_name: name
      }));
      // Navigate to chat page based on user type
      if (user.role === 'lawyer' || user.registration_id) {
        navigate('/lawyer-dashboard/chatapp');
      } else {
        navigate('/user/messages');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="gradient-text font-semibold text-base mb-2">
        {category}
      </div>
      <div 
        className="bg-gray-200/20 p-6 min-h-64 cursor-pointer hover:bg-gray-200/30 transition-colors duration-200"
        onClick={handleViewProfile}
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
          <img
            src={imageUrl}
            alt={`${name} - ${category} Attorney`}
            className="w-full sm:w-24 h-48 sm:h-32 object-cover flex-shrink-0"
            loading="lazy"
          />

          <div className="flex-1 sm:pl-2">
            <h3 className="text-2xl font-semibold gradient-text leading-7 hover:opacity-80 transition-opacity">
              {name}
            </h3>

            <div className="mt-1">
              <p className="text-sm font-medium uppercase tracking-widest text-gray-600 leading-4">
                Location
              </p>
              <div className="flex items-start gap-2 mt-0.5">
                <svg
                  className="w-2 h-3 text-gray-600 mt-1 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-xs text-gray-600 leading-3">{location}</p>
              </div>
            </div>

            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5"
                  viewBox="0 0 20 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z"
                    fill="#FDCF00"
                  />
                </svg>
              ))}
            </div>

            <div className="mt-1">
              <p className="text-sm text-black leading-4">
                {reviewCount} Legal Reviews {reviewScore}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-3">
                Licensed for {yearsLicensed} years
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-600 leading-4">
            Practice Areas
          </p>
          <p className="text-sm text-black mt-1 leading-4">{practiceAreas.join(", ")}</p>
        </div>

        <div className="mt-4 flex justify-between items-start">
          <p className="text-xs text-gray-600 leading-4 flex-1 mr-4">
            {description}
          </p>
          <div className="flex space-x-2 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleViewProfile();
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-400 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              View Profile
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LawyerDirectory() {
  const { user } = useAuth();
  const location = useLocation();
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    yearsLicensed: '',
    practiceArea: '',
    showAllFilters: false
  });

  const practiceAreas = ['Business', 'Family Law', 'Criminal Defense', 'Personal Injury', 'Corporate Law', 'Libel & Slander'];
  const yearsOptions = ['1-5 years', '6-10 years', '11-15 years', '16+ years'];
  
  // Check if user came from dashboard
  const cameFromDashboard = user && location.pathname === '/dashboard/lawyers';

  useEffect(() => {
    // SEO optimization
    const config = seoConfigs.lawyerDirectory;
    updatePageMeta(
      config.title,
      config.description,
      config.keywords,
      config.canonical
    );

    // Add structured data for lawyer directory
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Lawyer Directory",
      "description": "Browse qualified lawyers and attorneys by location and practice area",
      "url": "https://legalcity.com/lawyers",
      "numberOfItems": lawyers.length,
      "itemListElement": lawyers.slice(0, 10).map((lawyer, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Person",
          "name": lawyer.name,
          "jobTitle": "Attorney",
          "url": `https://legalcity.com/lawyer/${lawyer.id}`,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": lawyer.city,
            "addressRegion": lawyer.state
          }
        }
      }))
    };
    addStructuredData(structuredData);

    fetchLawyers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [lawyers, filters]);

  const applyFilters = () => {
    let filtered = [...lawyers];

    if (filters.practiceArea) {
      filtered = filtered.filter(lawyer => 
        lawyer.practiceAreas.some(area => 
          area.toLowerCase().includes(filters.practiceArea.toLowerCase())
        )
      );
    }

    if (filters.yearsLicensed) {
      const [min, max] = getYearRange(filters.yearsLicensed);
      filtered = filtered.filter(lawyer => {
        const years = lawyer.yearsLicensed;
        return years >= min && (max ? years <= max : true);
      });
    }

    setFilteredLawyers(filtered);
  };

  const getYearRange = (option) => {
    switch(option) {
      case '1-5 years': return [1, 5];
      case '6-10 years': return [6, 10];
      case '11-15 years': return [11, 15];
      case '16+ years': return [16, null];
      default: return [0, null];
    }
  };

  const clearFilters = () => {
    const newFilters = {
      yearsLicensed: '',
      practiceArea: '',
      showAllFilters: false
    };
    setFilters(newFilters);
    setFilteredLawyers(lawyers);
  };

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lawyers');
      console.log('Fetched lawyers:', response.data);
      const lawyersData = response.data.map(lawyer => ({
        ...lawyer,
        practiceAreas: lawyer.speciality ? [lawyer.speciality] : ['General Practice'],
        yearsLicensed: Math.floor(Math.random() * 15) + 5, // Placeholder
        rating: 5,
        reviewCount: Math.floor(Math.random() * 20) + 5,
        reviewScore: (Math.random() * 2 + 8).toFixed(1),
        location: `${lawyer.city || 'Unknown'}, ${lawyer.state || 'Unknown'}`,
        description: `Experienced ${lawyer.speciality || 'legal'} attorney with expertise in various legal matters.`,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name)}&background=0284c7&color=fff&size=200`,
        category: lawyer.speciality || 'General Practice'
      }));
      setLawyers(lawyersData);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      toast.error(error.response?.data?.message || 'Failed to load lawyers');
      setLawyers(fallbackLawyers);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {cameFromDashboard && <DashboardHeader />}

      
      {/* Professional Hero Section */}
      <section className="relative w-full h-[400px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1440&h=400&fit=crop&auto=format&q=80"
          alt="Professional legal consultation - Lawyer directory"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-85"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">Lawyer Directory</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 leading-relaxed font-medium max-w-3xl mx-auto">
              Connect with Top-Rated Legal Professionals. Browse our comprehensive directory of qualified attorneys, filter by practice area and experience to find the perfect legal representation for your needs.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Verified Attorneys</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Licensed Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Client Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-36 py-6">
        {/* Professional Filter Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Attorneys</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={clearFilters}
              className="h-12 px-6 rounded-lg border-2 border-gray-300 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              <svg
                className="w-5 h-5 stroke-gray-600"
                width="19"
                height="19"
                viewBox="0 0 19 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.61816 10.5156L7.51172 10.3799L7.51074 10.3789C7.51024 10.3783 7.50973 10.3772 7.50879 10.376C7.50664 10.3732 7.50327 10.3687 7.49902 10.3633C7.49052 10.3524 7.47753 10.3357 7.46094 10.3145C7.42778 10.272 7.37927 10.2094 7.31641 10.1289C7.18995 9.96708 7.00584 9.73252 6.77832 9.44141C6.32313 8.85899 5.69081 8.05021 4.9834 7.14551L0.646484 1.60352C0.298688 1.15354 0.6152 0.5 1.19629 0.5H17.8037C18.3848 0.5 18.7013 1.15354 18.3535 1.60352C17.1472 3.14178 15.4342 5.3362 14.0225 7.14551C13.3165 8.05026 12.6856 8.85894 12.2314 9.44141C12.0045 9.73248 11.8215 9.96703 11.6953 10.1289C11.6322 10.2098 11.5829 10.2729 11.5498 10.3154C11.5335 10.3363 11.5212 10.3524 11.5127 10.3633C11.5085 10.3686 11.5051 10.3732 11.5029 10.376C11.5019 10.3774 11.5005 10.3782 11.5 10.3789V10.3799L11.3936 10.5156V17.8125C11.3936 18.1868 11.0832 18.4999 10.7002 18.5H8.31152C7.92863 18.4997 7.61816 18.1868 7.61816 17.8125V10.5156Z"
                  stroke="#5A5A5A"
                />
              </svg>
              <span className="text-sm text-gray-700">Clear Filters</span>
            </button>

            <div className="relative">
              <select 
                value={filters.yearsLicensed}
                onChange={(e) => setFilters({...filters, yearsLicensed: e.target.value})}
                className="h-12 px-4 pr-10 rounded-lg border-2 border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all appearance-none cursor-pointer font-medium min-w-[160px]"
              >
                <option value="">Years Licensed</option>
                {yearsOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={filters.practiceArea}
                onChange={(e) => setFilters({...filters, practiceArea: e.target.value})}
                className="h-12 px-4 pr-10 rounded-lg border-2 border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all appearance-none cursor-pointer font-medium min-w-[160px]"
              >
                <option value="">Practice Area</option>
                {practiceAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.yearsLicensed || filters.practiceArea) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.yearsLicensed && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                Years: {filters.yearsLicensed}
                <button onClick={() => setFilters({...filters, yearsLicensed: ''})} className="hover:text-blue-900">
                  ×
                </button>
              </span>
            )}
            {filters.practiceArea && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
                Area: {filters.practiceArea}
                <button onClick={() => setFilters({...filters, practiceArea: ''})} className="hover:text-green-900">
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            Showing {filteredLawyers.length} of {lawyers.length} lawyers
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading lawyers...</p>
          </div>
        ) : (
          /* Lawyer Cards */
          <div className="space-y-6">
            {filteredLawyers.length > 0 ? (
              filteredLawyers.map((lawyer) => (
                <LawyerCard key={lawyer.id} {...lawyer} fromDashboard={cameFromDashboard} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No lawyers found matching your criteria.</p>
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LawyerDirectory;