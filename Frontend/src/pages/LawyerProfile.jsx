import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star, Phone, Mail, MapPin, Award, Calendar, Shield, MessageCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/layout/DashboardHeader';
import PaymentModal from '../components/payment/PaymentModal';
import ReviewModal from '../components/lawyer/ReviewModal';
import EndorsementModal from '../components/lawyer/EndorsementModal';
import { toast } from 'sonner';
import api from '../utils/api';

export default function LawyerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  
  // Check if user came from dashboard vs public pages
  const cameFromDashboard = localStorage.getItem('navigatedFromDashboard') === 'true' || location.pathname.startsWith('/dashboard/lawyer/');
  
  useEffect(() => {
    const loadData = async () => {
      await fetchLawyer();
      await fetchReviews();
      await fetchEndorsements();
    };
    loadData();
  }, [id]);
  
  const fetchLawyer = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'null' || id === 'undefined') {
        console.error('Invalid lawyer ID received:', id);
        throw new Error('Invalid lawyer ID');
      }
      
      console.log('Fetching lawyer with ID:', id);
      const response = await api.get(`/lawyers/${id}`);
      console.log('Lawyer data received:', response.data);
      setLawyer(response.data);
    } catch (error) {
      console.error('Error fetching lawyer:', error);
      if (error.response?.status === 404) {
        toast.error('Lawyer profile not found');
      } else {
        toast.error('Failed to load lawyer profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      const reviewData = response.data;
      setReviews(reviewData.reviews || []);
      
      // Update lawyer with real review data
      setLawyer(prev => ({
        ...prev,
        rating: parseFloat(reviewData.average_rating) || prev?.rating || 0,
        reviews: reviewData.total_reviews || 0
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchEndorsements = async () => {
    try {
      const response = await api.get(`/endorsements/${id}`);
      setEndorsements(response.data.endorsements || []);
    } catch (error) {
      console.error('Error fetching endorsements:', error);
    }
  };

  const handleReviewClick = () => {
    if (!user) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }
    if (user.role === 'lawyer') {
      toast.error('Only users can write reviews');
      return;
    }
    setShowReviewModal(true);
  };

  const handleEndorseClick = () => {
    if (!user) {
      toast.error('Please login to endorse this lawyer');
      navigate('/login');
      return;
    }
    if (user.role !== 'lawyer') {
      toast.error('Only lawyers can endorse other lawyers');
      return;
    }
    setShowEndorsementModal(true);
  };
  
  const handleChatWithLawyer = () => {
    if (!lawyer) return;
    console.log('Chat button clicked for lawyer:', { id, secure_id: lawyer.secure_id, name: lawyer.name });
    
    if (!user) {
      // Store lawyer info for after login
      const chatData = {
        partner_id: id, // Use route param (secure_id)
        partner_type: 'lawyer',
        partner_name: lawyer.name
      };
      localStorage.setItem('pendingChat', JSON.stringify(chatData));
      toast.error('Please login to chat with lawyers');
      navigate('/login');
      return;
    }
    
    // User is logged in - allow chat access
    
    // Set up chat and navigate
    const chatData = {
      partner_id: id, // Use route param (secure_id)
      partner_type: 'lawyer',
      partner_name: lawyer.name
    };
    localStorage.setItem('chatPartner', JSON.stringify(chatData));
    
    // Navigate to correct chat route
    if (user.role === 'lawyer' || user.registration_id) {
      navigate('/lawyer-dashboard/chatapp');
    } else {
      navigate('/user/messages');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lawyer profile...</p>
        </div>
      </div>
    );
  }
  
  if (!lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lawyer Profile Not Found</h2>
          <p className="text-gray-600 mb-6">The lawyer profile you're looking for doesn't exist or may have been removed.</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/lawyers')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse All Lawyers
            </button>
            <button 
              onClick={() => {
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
              }}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const getPlaceholderImage = (lawyerName) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lawyerName)}&backgroundColor=b6e3f4&size=200`;
  };
  
  const imageUrl = lawyer.profile_image && lawyer.profile_image !== 'null' && lawyer.profile_image.trim() !== ''
    ? (lawyer.profile_image.startsWith('http') ? lawyer.profile_image : `http://localhost:5001${lawyer.profile_image}`)
    : getPlaceholderImage(lawyer.name, lawyer.id);
  
  // Format lawyer data for display
  const displayLawyer = {
    ...lawyer,
    title: lawyer.speciality || 'Attorney',
    location: `${lawyer.city || 'Unknown'}, ${lawyer.state || 'Unknown'}`,
    rating: parseFloat(lawyer.rating) || 0,
    reviews: lawyer.reviews || 0,
    phone: lawyer.mobile_number || 'Contact for phone',
    image: imageUrl,
    yearsLicensed: Math.floor(Math.random() * 15) + 5,
    freeConsultation: true,
    virtualConsultation: true,
    about: lawyer.description || `Experienced ${lawyer.speciality || 'legal'} attorney with expertise in various legal matters.`,
    practiceAreas: [
      { name: lawyer.speciality || 'General Practice', percentage: 100, years: Math.floor(Math.random() * 15) + 5 }
    ],
    awards: ['Licensed Attorney', 'Verified Professional'],
    hourlyRate: '$300-500',
    address: `${lawyer.address || ''}, ${lawyer.city || ''}, ${lawyer.state || ''} ${lawyer.zip_code || ''}`.replace(/^,\s*|,\s*$/g, ''),
    // Include subscription data
    subscription_tier: lawyer.subscription_tier,
    subscription_status: lawyer.subscription_status
  };

  console.log('Lawyer subscription data:', { 
    subscription_tier: lawyer?.subscription_tier, 
    subscription_status: lawyer?.subscription_status 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show back to directory header for users from dashboard */}
      {user && cameFromDashboard && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => {
                // Redirect based on user role
                if (user.role === 'admin' || user.is_admin) {
                  navigate('/admin-dashboard');
                } else if (user.role === 'lawyer' || user.registration_id) {
                  navigate('/lawyer-dashboard');
                } else {
                  navigate('/user/lawyer-directory');
                }
              }}
              className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/20"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-semibold text-lg">
                Back to {user.role === 'admin' || user.is_admin ? 'Admin Dashboard' : 
                         user.role === 'lawyer' || user.registration_id ? 'Lawyer Dashboard' : 
                         'Lawyer Directory'}
              </span>
            </button>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0">
              <img
                src={displayLawyer.image}
                alt={displayLawyer.name}
                className="w-32 h-32 rounded-lg object-cover border border-gray-200 shadow-sm"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayLawyer.name}</h1>
                  <p className="text-xl text-blue-600 mb-2">{displayLawyer.title}</p>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{displayLawyer.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.round(displayLawyer.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-semibold">
                        {displayLawyer.rating > 0 ? displayLawyer.rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="ml-1 text-gray-600">
                        ({displayLawyer.reviews || 0} {displayLawyer.reviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                      Licensed {displayLawyer.yearsLicensed} years
                    </span>
                    {displayLawyer?.subscription_tier && displayLawyer.subscription_tier !== 'free' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-sm font-medium shadow-sm">
                        ⭐ {displayLawyer.subscription_tier.charAt(0).toUpperCase() + displayLawyer.subscription_tier.slice(1)} Member
                      </span>
                    )}
                    {displayLawyer.freeConsultation && (
                      <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">
                        Free Consultation
                      </span>
                    )}
                    {displayLawyer.virtualConsultation && (
                      <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-md text-sm font-medium border border-purple-200">
                        Virtual Available
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {user ? (
                    <button 
                      onClick={handleChatWithLawyer}
                      className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span>Start Chat</span>
                      </div>
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/login')}
                      className="flex items-center justify-center gap-3 bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold cursor-pointer hover:bg-gray-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Login to Chat</span>
                    </button>
                  )}
                  <button 
                    onClick={handleReviewClick}
                    className="flex items-center justify-center gap-3 border-2 border-blue-300 text-blue-700 px-8 py-4 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 font-medium"
                  >
                    <Star className="w-5 h-5" />
                    {user && user.role !== 'lawyer' ? 'Write Review' : 'Login to Review'}
                  </button>
                  <button 
                    onClick={handleEndorseClick}
                    className="flex items-center justify-center gap-3 border-2 border-green-300 text-green-700 px-8 py-4 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all duration-200 font-medium"
                  >
                    <Award className="w-5 h-5" />
                    {user && user.role === 'lawyer' ? 'Endorse Lawyer' : 'Login to Endorse'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">About</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{displayLawyer.about}</p>
            </div>

            {/* Subscription Benefits */}
            {displayLawyer?.subscription_tier && displayLawyer.subscription_tier !== 'free' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">⭐</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{displayLawyer.subscription_tier.charAt(0).toUpperCase() + displayLawyer.subscription_tier.slice(1)} Member Benefits</h2>
                    <p className="text-gray-600 text-sm">This lawyer has enhanced features and priority support</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Enhanced profile with video intro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Unlimited client messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Priority placement in search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Analytics dashboard</span>
                  </div>
                  {displayLawyer.subscription_tier === 'premium' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Featured homepage placement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Verified badge</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Practice Areas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">Practice Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayLawyer.practiceAreas.map((area, index) => (
                  <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{area.name}</h3>
                      <span className="text-2xl font-bold text-blue-600">{area.percentage}%</span>
                    </div>
                    <p className="text-gray-600">{area.years} years experience</p>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${area.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">Professional Resume</h2>
              
              {/* AVVO Rating */}
              <div className="mb-8">
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">10.0</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">AVVO RATING</h3>
                    <p className="text-orange-700 font-semibold text-lg">10.0 (Superb)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Work Experience */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded"></div>
                      Work Experience
                    </h3>
                    <div className="border-l-4 border-blue-200 pl-6">
                      <div className="relative">
                        <div className="absolute -left-8 w-4 h-4 bg-blue-600 rounded-full"></div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 text-lg">Owner</h4>
                          <p className="text-blue-600 font-medium">Family Law Center of the Rockies</p>
                          <p className="text-gray-600">2006 - Present</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-green-600 rounded"></div>
                      Education
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900">Roger Williams University</h4>
                        <p className="text-gray-600">JD - Juris Doctor</p>
                        <p className="text-gray-500 text-sm">2006</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900">University of Denver</h4>
                        <p className="text-gray-600">JD - Juris Doctor</p>
                        <p className="text-gray-500 text-sm">2006</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900">Southern Illinois University</h4>
                        <p className="text-gray-600">BS - Bachelor of Science</p>
                        <p className="text-gray-500 text-sm">2003</p>
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-purple-600 rounded"></div>
                      Languages
                    </h3>
                    <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium border border-purple-200">
                      English
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Honors and Awards */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-yellow-600 rounded"></div>
                      Honors & Awards
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="w-6 h-6 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Client Champion Platinum</h4>
                          <p className="text-gray-600 text-sm">Martindale-Hubbell • 2022</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="w-6 h-6 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">AV Peer Review Rating</h4>
                          <p className="text-gray-600 text-sm">Martindale-Hubbell • 2022</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="w-6 h-6 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Client Champion Award</h4>
                          <p className="text-gray-600 text-sm">Martindale-Hubbell • 2021</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Associations */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-600 rounded"></div>
                      Professional Associations
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900">7th Judicial District Bar Association</h4>
                        <p className="text-gray-600 text-sm">Member • 2017 - Present</p>
                      </div>
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900">Southwestern Colorado Bar Association</h4>
                        <p className="text-gray-600 text-sm">Member • 2017 - Present</p>
                      </div>
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900">Heart of the Rockies Bar Association</h4>
                        <p className="text-gray-600 text-sm">Member • 2017 - Present</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publications & Speaking - Full Width */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Publications */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-red-600 rounded"></div>
                      Publications
                    </h3>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900">Top 100 Attorneys Magazine</h4>
                      <p className="text-gray-600">Feature Article</p>
                      <p className="text-gray-500 text-sm">2022</p>
                    </div>
                  </div>

                  {/* Speaking Engagements */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-teal-600 rounded"></div>
                      Speaking Engagements
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 text-sm">Stepparent Adoption in Colorado</h4>
                        <p className="text-gray-600 text-sm">Legal Resource Day • 2021</p>
                      </div>
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 text-sm">Getting Custody: Parents and Non-Parents</h4>
                        <p className="text-gray-600 text-sm">Legal Resource Day • 2021</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Client Reviews</h2>
                <button
                  onClick={handleReviewClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Write Review
                </button>
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-gray-700 mb-2">"{review.review}"</p>
                      )}
                      <p className="text-sm text-gray-500">- {review.user_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>

            {/* Attorney Endorsements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Attorney Endorsements</h2>
                <button
                  onClick={handleEndorseClick}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Endorse Lawyer
                </button>
              </div>
              
              {endorsements.length > 0 ? (
                <div className="space-y-6">
                  {endorsements.map((endorsement) => {
                    const initials = endorsement.endorser_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();
                    return (
                      <div key={endorsement.id} className="border-b border-gray-200 pb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">{initials}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{endorsement.endorser_name}</h4>
                              <span className="text-sm text-gray-500">{endorsement.endorser_speciality || 'Attorney'}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {new Date(endorsement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Relationship: {endorsement.relationship}
                            </p>
                            <p className="text-gray-700 italic">"{endorsement.endorsement_text}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No endorsements yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{displayLawyer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{displayLawyer.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span className="text-gray-700">{displayLawyer.address}</span>
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rates</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-semibold">{displayLawyer.hourlyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Free Consultation:</span>
                  <span className="font-semibold text-green-600">30 minutes</span>
                </div>
              </div>
            </div>

            {/* Awards */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Awards & Recognition</h3>
              <div className="space-y-2">
                {displayLawyer.awards.map((award, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">{award}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Schedule Consultation</span>
                </button>
                {user ? (
                  <button 
                    onClick={handleChatWithLawyer}
                    className="group w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:scale-105 hover:shadow-md border border-green-200 hover:border-green-300"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Start Chat</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center gap-3 p-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Login to Chat</span>
                  </button>
                )}
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Request Quote</span>
                </button>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Office Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-red-600">Closed</span>
                </div>
              </div>
            </div>

            {/* Case Types */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Case Types Handled</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Divorce Cases</span>
                  <span className="font-medium text-green-600">150+</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Custody Cases</span>
                  <span className="font-medium text-green-600">89+</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Adoptions</span>
                  <span className="font-medium text-green-600">45+</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Child Support</span>
                  <span className="font-medium text-green-600">120+</span>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Options</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Credit Cards Accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Payment Plans Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Contingency Fee Options</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Free Initial Consultation</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Won custody case</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Published article</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Speaking engagement</p>
                    <p className="text-xs text-gray-500">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Lawyers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Similar Lawyers</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Sarah Johnson</h4>
                    <p className="text-xs text-gray-600">Family Law • 4.9★</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Michael Chen</h4>
                    <p className="text-xs text-gray-600">Family Law • 4.8★</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Emily Rodriguez</h4>
                    <p className="text-xs text-gray-600">Family Law • 4.9★</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        lawyer={displayLawyer}
        user={user}
      />
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        lawyerId={id}
        lawyerName={lawyer?.name}
      />
      
      {/* Endorsement Modal */}
      <EndorsementModal
        isOpen={showEndorsementModal}
        onClose={() => setShowEndorsementModal(false)}
        lawyerId={id}
        lawyerName={lawyer?.name}
      />
    </div>
  );
}