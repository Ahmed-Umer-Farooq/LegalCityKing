import { Star, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LawyersCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  
  const fromDashboard = user && location.pathname === '/dashboard/find-lawyer';

  useEffect(() => {
    fetchFeaturedLawyers();
  }, []);

  const fetchFeaturedLawyers = async () => {
    try {
      const response = await api.get('/lawyers');
      console.log('Fetched lawyers for carousel:', response.data);
      
      // Get all lawyers, prioritize those with secure_id
      const allLawyers = response.data || [];
      const lawyersWithProfiles = allLawyers.filter(lawyer => lawyer.secure_id);
      
      console.log('Lawyers with profiles:', lawyersWithProfiles.length);
      
      // If we have lawyers with profiles, use them; otherwise use first 6 lawyers
      const selectedLawyers = lawyersWithProfiles.length > 0 
        ? lawyersWithProfiles.slice(0, 6)
        : allLawyers.slice(0, 6);
      
      const getPlaceholderImage = (lawyerName, lawyerId) => {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lawyerName)}&backgroundColor=b6e3f4&size=200`;
      };
      
      const lawyersData = selectedLawyers.map(lawyer => {
        const imageUrl = lawyer.profile_image && lawyer.profile_image !== 'null' && lawyer.profile_image.trim() !== ''
          ? (lawyer.profile_image.startsWith('http') ? lawyer.profile_image : `http://localhost:5001${lawyer.profile_image}`)
          : getPlaceholderImage(lawyer.name, lawyer.id);
        
        return {
          id: lawyer.secure_id || lawyer.id,
          name: lawyer.name,
          specialty: lawyer.speciality || 'General Practice',
          rating: parseFloat(lawyer.rating) || 4.5,
          reviews: lawyer.reviews || Math.floor(Math.random() * 100) + 20,
          location: `${lawyer.city || 'Unknown'}, ${lawyer.state || 'Unknown'}`,
          practiceAreas: lawyer.speciality ? [lawyer.speciality] : ['General Practice'],
          successTitle: "Client Testimonial",
          successAuthor: "Verified Client",
          successDate: "Recent",
          successDescription: `Experienced ${lawyer.speciality || 'legal'} attorney providing professional legal services with proven track record.`,
          image: imageUrl
        };
      });
      
      console.log('Featured lawyers to display:', lawyersData.length);
      setLawyers(lawyersData);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxSlides = Math.max(0, lawyers.length - 3);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxSlides ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxSlides : prev - 1));
  };

  const getStarClass = (i, rating) => {
    return i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300';
  };

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading featured lawyers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (lawyers.length === 0) {
    return (
      <div className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Lawyers</h2>
            <p className="text-gray-600">No featured lawyers available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Lawyers</h2>
            <p className="text-sm text-gray-600 mt-1">Top-rated legal professionals</p>
          </div>
          <Link 
            to="/lawyers" 
            className="text-sm text-[#0071BC] hover:text-[#005A94] font-semibold flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lawyers.map((lawyer) => (
            <Link
              key={lawyer.id}
              to={fromDashboard ? `/dashboard/lawyer/${lawyer.id}` : `/lawyer/${lawyer.id}`}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-xl hover:border-[#0071BC] transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={lawyer.image}
                    alt={lawyer.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#0071BC] transition-colors"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{lawyer.name}</h3>
                  
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#0071BC] text-xs font-medium rounded mb-2">
                    {lawyer.specialty}
                  </span>
                  
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${getStarClass(i, lawyer.rating)}`} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{lawyer.rating}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{lawyer.location}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}