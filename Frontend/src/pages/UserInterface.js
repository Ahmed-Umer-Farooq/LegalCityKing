import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePageMeta, addStructuredData, seoConfigs } from '../utils/seo';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'; 

/**
 * Sub-components (Icons & Logo)
 */

function LegalCityLogo() {
  const navigate = useNavigate();
  
  return (
    <div 
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => navigate('/')}
    >
      <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
        <span className="text-[#0284C7] font-bold text-lg tracking-tight">Legal</span>
      </div>
      <span className="text-white font-bold text-lg tracking-tight">City</span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
      <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" fill="#FDCF00"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="flex-shrink-0 mt-[2px]">
      <path d="M4 0C1.78857 0 0 1.878 0 4.2C0 7.35 4 12 4 12C4 12 8 7.35 8 4.2C8 1.878 6.21143 0 4 0ZM4 5.7C3.21143 5.7 2.57143 5.028 2.57143 4.2C2.57143 3.372 3.21143 2.7 4 2.7C4.78857 2.7 5.42857 3.372 5.42857 4.2C5.42857 5.028 4.78857 5.7 4 5.7Z" fill="#5A5A5A"/>
    </svg>
  );
}

/**
 * Layout Components
 */

function Header({ currentLanguage, setCurrentLanguage, translations }) {
  const navigate = useNavigate();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showDirectoryMenu, setShowDirectoryMenu] = useState(false);

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Español' },
    { code: 'FR', name: 'Français' },
    { code: 'DE', name: 'Deutsch' }
  ];

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/register');
  };

  const handleLanguageSelect = (language) => {
    setCurrentLanguage(language.code);
    setShowLanguageMenu(false);
  };

  return (
    <header className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center h-16" style={{ height: 64 }}>
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between px-4 lg:px-[144px]">
        <div className="flex items-center gap-6">
          <LegalCityLogo />
          <div className="relative">
            <button 
              onClick={() => setShowDirectoryMenu(!showDirectoryMenu)}
              className="hidden md:flex items-center text-white text-sm gap-2 hover:opacity-90 transition-opacity"
            >
              <span>{translations[currentLanguage].lawyerDirectory}</span>
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.491211 0.34375L3.99121 5.34375L7.49121 0.34375" stroke="white" strokeWidth="1.2"/>
              </svg>
            </button>
            
            {showDirectoryMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    navigate('/lawyers');
                    setShowDirectoryMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  Directory
                </button>
                <button
                  onClick={() => {
                    navigate('/');
                    setShowDirectoryMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg"
                >
                  Find Lawyer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleLoginClick}
            className="flex items-center gap-2 h-[38px] px-4 rounded-[20px] bg-transparent border border-white/30 hover:bg-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="4" r="3" stroke="white" strokeWidth="1.5"/>
              <path d="M2 12c0-2.5 2.5-4 5-4s5 1.5 5 4" stroke="white" strokeWidth="1.5"/>
            </svg>
            <span className="text-white text-sm">{translations[currentLanguage].login}</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 h-[38px] px-3 rounded-[20px] bg-transparent border border-white/30 hover:bg-white/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/>
                <path d="M2 8h12M8 2c1.5 0 3 2.5 3 6s-1.5 6-3 6-3-2.5-3-6 1.5-6 3-6z" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span className="text-white text-sm">{currentLanguage}</span>
              <svg className={`w-3 h-3 text-white transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-10 min-w-[120px]">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      currentLanguage === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSignupClick}
            className="h-[38px] px-6 rounded-[20px] bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
{translations[currentLanguage].signup}
          </button>
        </div>
      </div>
    </header>
  );
}

const HeroSection = React.memo(function HeroSection({ currentLanguage, translations }) {
  const navigate = useNavigate();

  return (
    <section className="relative w-full h-[500px] sm:h-[600px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <img
        src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80"
        srcSet="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=768&h=400&fit=crop&auto=format&q=80 768w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80 1440w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=2880&h=1200&fit=crop&auto=format&q=80 2880w"
        sizes="(max-width: 768px) 768px, (max-width: 1440px) 1440px, 2880px"
        alt="Professional legal consultation - Modern law office with natural lighting"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        loading="eager"
        fetchpriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

      <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[700px] text-center">
          <h1 className="text-gray-900 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">LegalCity</span>
          </h1>
          <p className="text-gray-700 text-xl sm:text-2xl mb-8 leading-relaxed font-medium">
            Premier Legal Network Connecting You with Top-Tier Attorneys. Experience Excellence in Legal Representation with Proven Results and Personalized Service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-10 py-4 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
            >
              Find Lawyers
            </button>
            <button
              onClick={() => navigate('/legal-blog')}
              className="px-10 py-4 bg-white/90 backdrop-blur-md text-gray-800 font-bold rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border-2 border-gray-200 text-lg"
            >
              Legal Resources
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

const LawyerCard = React.memo(function LawyerCard({
  category,
  name,
  rating,
  location,
  image,
  practiceAreas,
  id,
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer" onClick={() => navigate(`/lawyer/${id}`)}>
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={image}
            alt={name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#0071BC] text-xs font-semibold rounded-full shadow">
          {category}
        </div>
        <div className="absolute bottom-3 left-3 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
      </div>

      <div className="p-5 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
        
        <div className="flex items-center justify-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4" viewBox="0 0 20 19" fill="none">
                <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" fill="#FCD34D"/>
              </svg>
            ))}
          </div>
          <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
        </div>

        <div className="flex items-center justify-center gap-1 text-gray-600 mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{location}</span>
        </div>

        <button className="w-full py-3 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-semibold rounded-lg hover:shadow-lg transition-all">
          View Profile
        </button>
      </div>
    </div>
  );
});

const LawyerCarousel = React.memo(function LawyerCarousel() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/lawyers');
        const data = await response.json();
        
        const formattedLawyers = data.slice(0, 3).map(lawyer => {
          const city = lawyer.city || '';
          const state = lawyer.state || '';
          const location = [city, state].filter(Boolean).join(', ') || 'Location not specified';
          
          const getPlaceholderImage = (lawyerName, lawyerId) => {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lawyerName)}&backgroundColor=b6e3f4&size=200`;
          };
          
          const imageUrl = lawyer.profile_image && lawyer.profile_image !== 'null' && lawyer.profile_image.trim() !== ''
            ? (lawyer.profile_image.startsWith('http') ? lawyer.profile_image : `http://localhost:5001${lawyer.profile_image}`)
            : getPlaceholderImage(lawyer.name, lawyer.id);
          
          return {
            id: lawyer.secure_id || lawyer.id,
            category: lawyer.speciality || 'General Practice',
            name: lawyer.name,
            rating: parseFloat(lawyer.rating) || 4.5,
            location: location,
            image: imageUrl,
            practiceAreas: lawyer.speciality || 'General Practice',
          };
        });
        
        setLawyers(formattedLawyers);
      } catch (error) {
        console.error('Error fetching lawyers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLawyers();
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-gray-50 py-12">
        <div className="w-full max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600">Loading featured lawyers...</p>
        </div>
      </section>
    );
  }

  if (lawyers.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gray-50 py-12">
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Featured Legal Professionals</h2>
          <p className="text-gray-600">Connect with top-rated lawyers in your area</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lawyers.map((lawyer, index) => (
            <LawyerCard key={index} {...lawyer} />
          ))}
        </div>
      </div>
    </section>
  );
});

const RecentBlogs = React.memo(function RecentBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBlogs = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/blogs?limit=3');
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setBlogs(data);
        }
      } catch (error) {
        console.error('Error fetching recent blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentBlogs();
  }, []);

  if (loading) {
    return (
      <section className="bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-600">Loading recent blogs...</p>
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Legal Insights</h2>
            <p className="text-gray-600">Stay informed with the latest legal news and expert analysis</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <div key={blog.secure_id || blog.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => navigate(`/blog/${blog.secure_id || blog.id}`)}>
                {blog.featured_image && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={blog.featured_image.startsWith('http') ? blog.featured_image : `http://localhost:5001${blog.featured_image}`}
                      alt={blog.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                      {blog.category || 'Legal News'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {blog.excerpt || (blog.content && blog.content.substring(0, 120) + '...')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {blog.author_name || 'LegalCity Team'}</span>
                    <span>{new Date(blog.published_at || blog.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/legal-blog')}
              className="px-8 py-3 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              View All Articles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

function Footer({ currentLanguage, translations }) {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
                <span className="text-[#0284C7] font-bold text-lg tracking-tight">Legal</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">City</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Connect with qualified legal professionals in your area. Find the right lawyer for your specific legal needs with our comprehensive directory.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => navigate('/lawyers')} className="text-gray-300 hover:text-white transition-colors">Find Lawyers</button></li>
              <li><button onClick={() => navigate('/login')} className="text-gray-300 hover:text-white transition-colors">Login</button></li>
              <li><button onClick={() => navigate('/register')} className="text-gray-300 hover:text-white transition-colors">Sign Up</button></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal Areas</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Corporate Law</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Family Law</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Criminal Defense</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Personal Injury</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 LegalCity. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Main Page Component
 */

export default function UserInterface() {
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState('EN');

  // SEO and performance optimization
  useEffect(() => {
    const config = seoConfigs.home;
    updatePageMeta(
      config.title,
      config.description,
      config.keywords,
      config.canonical
    );

    // Preload critical images
    const heroImage = new Image();
    heroImage.src = "https://api.builder.io/api/v1/image/assets/TEMP/d12735386b9fab735739b6b5424336fcff2f69c9?width=1440";

    // Add structured data for the homepage
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "LegalCity",
      "url": "https://legalcity.com",
      "description": config.description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://legalcity.com/lawyers?search={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "provider": {
        "@type": "Organization",
        "name": "LegalCity",
        "serviceType": "Legal Services Directory",
        "areaServed": "United States"
      }
    };
    addStructuredData(structuredData);
  }, []);

  const translations = {
    EN: {
      findLawyer: 'Find Lawyer',
      practiceNameLawyer: 'Practice name / Lawyer',
      specialty: 'Specialty',
      cityStateZip: 'City, State or Zip',
      searchLawyers: 'Search Lawyers',
      topFeaturesLawyers: 'Top Features lawyers near you'
    },
    ES: {
      findLawyer: 'Encontrar Abogado',
      practiceNameLawyer: 'Nombre del bufete / Abogado',
      specialty: 'Especialidad',
      cityStateZip: 'Ciudad, Estado o Código Postal',
      searchLawyers: 'Buscar Abogados',
      topFeaturesLawyers: 'Los mejores abogados cerca de ti'
    },
    FR: {
      findLawyer: 'Trouver un Avocat',
      practiceNameLawyer: 'Nom du cabinet / Avocat',
      specialty: 'Spécialité',
      cityStateZip: 'Ville, État ou Code Postal',
      searchLawyers: 'Rechercher des Avocats',
      topFeaturesLawyers: 'Les meilleurs avocats près de chez vous'
    },
    DE: {
      findLawyer: 'Anwalt Finden',
      practiceNameLawyer: 'Kanzleiname / Anwalt',
      specialty: 'Fachgebiet',
      cityStateZip: 'Stadt, Bundesland oder PLZ',
      searchLawyers: 'Anwälte Suchen',
      topFeaturesLawyers: 'Top Anwälte in Ihrer Nähe'
    }
  };

  return (
    <>
      <HeroSection currentLanguage={currentLanguage} translations={translations} />
      <Suspense fallback={<div className="w-full h-96 bg-gray-50 animate-pulse flex items-center justify-center"><span className="text-gray-500">Loading lawyers...</span></div>}>
        <LawyerCarousel />
      </Suspense>
      
      {/* Stats Section */}
      <section className="bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Legal Services</h2>
              <p className="text-gray-600">From personal matters to complex business litigation, our network covers all areas of law</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <button 
                onClick={() => navigate('/lawyers')}
                className="p-4 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">15,000+</div>
                <div className="text-gray-600 group-hover:text-blue-700 transition-colors">Verified Attorneys</div>
              </button>
              <button 
                onClick={() => navigate('/lawyers')}
                className="p-4 rounded-lg hover:bg-green-50 transition-colors cursor-pointer group"
              >
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">98%</div>
                <div className="text-gray-600 group-hover:text-green-700 transition-colors">Client Satisfaction</div>
              </button>
              <button 
                onClick={() => navigate('/lawyers')}
                className="p-4 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer group"
              >
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">50+</div>
                <div className="text-gray-600 group-hover:text-purple-700 transition-colors">Practice Areas</div>
              </button>
              <button 
                onClick={() => navigate('/lawyers')}
                className="p-4 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group"
              >
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">24/7</div>
                <div className="text-gray-600 group-hover:text-orange-700 transition-colors">Support Available</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About LegalCity Section */}
      <section className="bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose LegalCity?</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                LegalCity is the premier legal network connecting individuals and businesses with top-tier attorneys across the United States. Our rigorous vetting process ensures you access only the most qualified legal professionals.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Professionals</h3>
                    <p className="text-gray-600 text-sm">All attorneys undergo comprehensive background checks and credential verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Matching</h3>
                    <p className="text-gray-600 text-sm">Advanced algorithm matches you with attorneys specialized in your specific legal needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Transparent Process</h3>
                    <p className="text-gray-600 text-sm">Clear pricing, detailed profiles, and client reviews for informed decision-making</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop" 
                alt="Professional legal consultation" 
                className="rounded-lg shadow-lg w-full h-80 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Legal Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From personal matters to complex business litigation, our network covers all areas of law</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <button 
              onClick={() => navigate('/lawyers?practice=Corporate Law')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Corporate Law</h3>
              <p className="text-gray-600 text-sm">Business formation, contracts, mergers, acquisitions, and corporate compliance</p>
            </button>
            <button 
              onClick={() => navigate('/lawyers?practice=Family Law')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Family Law</h3>
              <p className="text-gray-600 text-sm">Divorce, child custody, adoption, prenuptials, and domestic relations</p>
            </button>
            <button 
              onClick={() => navigate('/lawyers?practice=Criminal Defense')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Criminal Defense</h3>
              <p className="text-gray-600 text-sm">DUI, white-collar crimes, federal charges, and criminal appeals</p>
            </button>
            <button 
              onClick={() => navigate('/lawyers?practice=Personal Injury')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Personal Injury</h3>
              <p className="text-gray-600 text-sm">Auto accidents, medical malpractice, workplace injuries, and wrongful death</p>
            </button>
            <button 
              onClick={() => navigate('/lawyers?practice=Real Estate')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">Real Estate</h3>
              <p className="text-gray-600 text-sm">Property transactions, landlord-tenant disputes, and real estate litigation</p>
            </button>
            <button 
              onClick={() => navigate('/lawyers?practice=Estate Planning')}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">Estate Planning</h3>
              <p className="text-gray-600 text-sm">Wills, trusts, probate, and comprehensive estate planning strategies</p>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Blogs Section */}
      <RecentBlogs />

      {/* Trust Indicators & Awards */}
      <section className="bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted & Recognized</h2>
            <p className="text-gray-600">Certified by leading legal organizations and award-winning platform</p>
          </div>
          
          {/* Certifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-blue-600 text-lg">ABA</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">American Bar Association</div>
              <div className="text-xs text-gray-600">Certified Member</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-green-600 text-lg">AVVO</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">AVVO Legal Directory</div>
              <div className="text-xs text-gray-600">Verified Partner</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-yellow-600 text-lg">BBB</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">Better Business Bureau</div>
              <div className="text-xs text-gray-600">A+ Rating</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">SSL Secured</div>
              <div className="text-xs text-gray-600">256-bit Encryption</div>
            </div>
          </div>

          {/* Awards */}
          <div className="border-t border-gray-200 pt-12">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Industry Awards & Recognition</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">Best Legal Platform 2024</div>
                <div className="text-xs text-gray-600">Legal Tech Awards</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">Excellence in Innovation</div>
                <div className="text-xs text-gray-600">National Law Journal</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">Top Client Satisfaction</div>
                <div className="text-xs text-gray-600">Legal Services Review</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}