import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { updatePageMeta, addStructuredData, seoConfigs, generateLawyerStructuredData } from '../../utils/seo';
import { responsive } from '../../utils/responsive';

// Default fallback data if API fails
const fallbackLawyers = [];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user came from dashboard
  const cameFromDashboard = location.state?.from === 'dashboard';

  const handleBackNavigation = () => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'admin' || user.is_admin) {
        navigate('/admin-dashboard');
      } else if (user.role === 'lawyer' || user.registration_id) {
        navigate('/lawyer-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } else {
      navigate('/');
    }
  };

  // Check if coming from user dashboard
  const isFromUserDashboard = location.pathname.includes('/user/lawyer-directory') || location.state?.from === 'user-dashboard';

  return (
    <header className="w-full h-16 bg-gradient-to-b from-blue-600 to-cyan-400 flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-36">
      <div className="flex items-center flex-shrink-0">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-white rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm">
            <span className="text-[#0284C7] font-bold text-base sm:text-lg tracking-tight">Legal</span>
          </div>
          <span className="text-white font-bold text-base sm:text-lg tracking-tight">City</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
              className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 md:px-7 rounded-full bg-white/20 text-white text-xs sm:text-sm font-normal hover:bg-white/30 transition-colors"
            >
              <span className="hidden sm:inline">{isFromUserDashboard ? 'Back to Dashboard' : 'Back to Home'}</span>
              <span className="sm:hidden">Back</span>
            </button>
            {!isFromUserDashboard && (
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 md:px-7 rounded-full bg-white text-black text-xs sm:text-sm font-normal hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 md:px-7 rounded-full bg-white text-black text-xs sm:text-sm font-normal hover:bg-gray-100 transition-colors"
          >
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
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
      localStorage.setItem('navigatedFromDashboard', 'true');
    }
    navigate(`/lawyer/${id}`);
  };

  return (
    <div className="w-full">
      <div className={`${responsive.card} overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
        {/* Category Badge */}
        <div className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] px-4 sm:px-6 py-2 sm:py-3">
          <span className={`text-white font-semibold ${responsive.text.xs} uppercase tracking-wide`}>{category}</span>
        </div>
        
        <div className={responsive.spacing.card}>
          <div className={`${responsive.flex.responsive} ${responsive.spacing.gap}`}>
            {/* Professional Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <img
                src={imageUrl}
                alt={`${name} - ${category} Attorney`}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-full border-4 border-gray-100 shadow-md"
                loading="lazy"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              {/* Lawyer Name */}
              <h3 className={`${responsive.text.lg} font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer`} onClick={handleViewProfile}>
                {name}
              </h3>

              {/* Location */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className={`${responsive.text.xs} text-gray-600`}>{location}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.round(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className={`${responsive.text.xs} font-semibold text-gray-700`}>
                  {rating > 0 ? rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-gray-500">
                  ({reviewCount || 0} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              {/* Experience */}
              <div className="mb-4 flex justify-center md:justify-start">
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {yearsLicensed} years licensed
                </span>
              </div>
            </div>
          </div>

          {/* Practice Areas */}
          <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h4 className={`${responsive.text.xs} font-semibold text-gray-700 mb-2 uppercase tracking-wide`}>Practice Areas</h4>
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center md:justify-start">
              {practiceAreas.map((area, index) => (
                <span key={index} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200 font-medium">
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Description & Action */}
          <div className={`mt-4 ${responsive.flex.responsive} sm:items-end sm:justify-between ${responsive.spacing.gap}`}>
            <p className={`${responsive.text.xs} text-gray-600 leading-relaxed flex-1 text-center md:text-left`}>
              {description}
            </p>
            <button 
              onClick={handleViewProfile}
              className={`px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 ${responsive.text.xs} whitespace-nowrap w-full sm:w-auto`}
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
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get URL params
  const searchParams = new URLSearchParams(location.search);
  const urlSearch = searchParams.get('search') || '';
  const urlLocation = searchParams.get('location') || '';
  const urlPracticeArea = searchParams.get('practiceArea') || '';
  
  const [filters, setFilters] = useState({
    yearsLicensed: '',
    practiceArea: urlPracticeArea,
    search: urlSearch,
    location: urlLocation,
    showAllFilters: false
  });

  const practiceAreas = ['Business', 'Family Law', 'Criminal Defense', 'Personal Injury', 'Corporate Law', 'Libel & Slander'];
  const yearsOptions = ['1-5 years', '6-10 years', '11-15 years', '16+ years'];
  
  // Check if user came from dashboard
  const cameFromDashboard = user && location.pathname === '/dashboard/lawyers';

  useEffect(() => {
    // Enhanced SEO optimization for Lawyer Directory
    document.title = 'Find Lawyers Near You - Professional Attorney Directory | LegalCity';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Browse our comprehensive lawyer directory. Find qualified attorneys by practice area, location, and experience. Connect with top-rated legal professionals for your legal needs.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }
    
    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    metaKeywords.setAttribute('content', 'lawyer directory, find lawyers, attorney search, legal professionals, law firms, legal services, qualified attorneys');
    if (!document.querySelector('meta[name="keywords"]')) {
      document.head.appendChild(metaKeywords);
    }

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

    if (filters.search) {
      filtered = filtered.filter(lawyer => 
        lawyer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        lawyer.speciality?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lawyer.practiceAreas.some(area => area.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(lawyer => 
        lawyer.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

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
      search: '',
      location: '',
      showAllFilters: false
    };
    setFilters(newFilters);
    navigate('/lawyers');
  };

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lawyers');
      console.log('Fetched lawyers:', response.data);
      const getPlaceholderImage = (lawyerName) => {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lawyerName)}&backgroundColor=b6e3f4&size=200`;
      };
      
      const lawyersData = response.data.map(lawyer => {
        const imageUrl = lawyer.profile_image && lawyer.profile_image !== 'null' && lawyer.profile_image.trim() !== ''
          ? (lawyer.profile_image.startsWith('http') ? lawyer.profile_image : `http://localhost:5001${lawyer.profile_image}`)
          : getPlaceholderImage(lawyer.name, lawyer.id);
        
        return {
          ...lawyer,
          practiceAreas: lawyer.speciality ? [lawyer.speciality] : ['General Practice'],
          yearsLicensed: Math.floor(Math.random() * 15) + 5,
          rating: parseFloat(lawyer.rating) || 0,
          reviewCount: lawyer.reviews || lawyer.reviewCount || 0,
          reviewScore: parseFloat(lawyer.rating) || 0,
          location: `${lawyer.city || 'Unknown'}, ${lawyer.state || 'Unknown'}`,
          description: `Experienced ${lawyer.speciality || 'legal'} attorney with expertise in various legal matters.`,
          imageUrl: imageUrl,
          category: lawyer.speciality || 'General Practice'
        };
      });
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
      <section className="relative w-full h-[300px] sm:h-[350px] lg:h-[400px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1440&h=400&fit=crop&auto=format&q=80"
          alt="Professional lawyer directory - Find qualified attorneys and legal professionals for your legal needs"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-85"
          loading="eager"
          width="1440"
          height="400"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

        <div className={`relative h-full ${responsive.flex.colCenter} ${responsive.spacing.card}`}>
          <div className="text-center max-w-4xl">
            <h1 className={`${responsive.text['3xl']} font-bold text-gray-900 mb-4 sm:mb-6 leading-tight`}>
              <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">Lawyer Directory</span>
            </h1>
            <p className={`${responsive.text.base} text-gray-700 mb-6 sm:mb-8 leading-relaxed font-medium max-w-3xl mx-auto`}>
              Connect with Top-Rated Legal Professionals. Browse our comprehensive directory of qualified attorneys, filter by practice area and experience to find the perfect legal representation for your needs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
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
      <div className={`${responsive.container} py-6`}>
        {/* Search Bar */}
        <div className={`${responsive.card} mb-6`}>
          <div className={`${responsive.flex.responsive} ${responsive.spacing.gap}`}>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or practice area"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className={`${responsive.input} h-10 sm:h-12 border-2 border-gray-300 focus:border-blue-500`}
              />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Location (city, state)"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className={`${responsive.input} h-10 sm:h-12 border-2 border-gray-300 focus:border-blue-500`}
              />
            </div>
          </div>
        </div>

        {/* Professional Filter Section */}
        <div className={`${responsive.card} mb-8`}>
          <h2 className={`${responsive.text.lg} font-semibold text-gray-900 mb-4`}>Filter Attorneys</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={clearFilters}
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-lg border-2 border-gray-300 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
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
              <span className={`${responsive.text.xs} text-gray-700`}>Clear Filters</span>
            </button>

            <div className="relative">
              <select 
                value={filters.yearsLicensed}
                onChange={(e) => setFilters({...filters, yearsLicensed: e.target.value})}
                className={`h-10 sm:h-12 px-3 sm:px-4 pr-8 sm:pr-10 rounded-lg border-2 border-gray-300 ${responsive.text.xs} text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all appearance-none cursor-pointer font-medium min-w-[140px] sm:min-w-[160px]`}
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
                className={`h-10 sm:h-12 px-3 sm:px-4 pr-8 sm:pr-10 rounded-lg border-2 border-gray-300 ${responsive.text.xs} text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all appearance-none cursor-pointer font-medium min-w-[140px] sm:min-w-[160px]`}
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
        {(filters.search || filters.location || filters.yearsLicensed || filters.practiceArea) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.search && (
              <span className={`px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full ${responsive.text.xs} flex items-center gap-2`}>
                Search: {filters.search}
                <button onClick={() => setFilters({...filters, search: ''})} className="hover:text-purple-900">
                  ×
                </button>
              </span>
            )}
            {filters.location && (
              <span className={`px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full ${responsive.text.xs} flex items-center gap-2`}>
                Location: {filters.location}
                <button onClick={() => setFilters({...filters, location: ''})} className="hover:text-orange-900">
                  ×
                </button>
              </span>
            )}
            {filters.yearsLicensed && (
              <span className={`px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full ${responsive.text.xs} flex items-center gap-2`}>
                Years: {filters.yearsLicensed}
                <button onClick={() => setFilters({...filters, yearsLicensed: ''})} className="hover:text-blue-900">
                  ×
                </button>
              </span>
            )}
            {filters.practiceArea && (
              <span className={`px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full ${responsive.text.xs} flex items-center gap-2`}>
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
          <p className={`text-gray-600 ${responsive.text.xs}`}>
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