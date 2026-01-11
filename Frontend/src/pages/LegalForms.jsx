import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEOHead from '../components/SEOHead';
import api from '../utils/api';

const API_BASE_URL = 'http://localhost:5001/api';

export default function LegalForms() {
  const navigate = useNavigate();
  const [approvedForms, setApprovedForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    practiceArea: '',
    price: '',
    sortBy: ''
  });

  useEffect(() => {
    fetchApprovedForms();
  }, []);

  const fetchApprovedForms = async () => {
    try {
      const response = await api.get('/forms/public');
      const forms = response.data.forms || [];
      setApprovedForms(forms);
      setFilteredForms(forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...approvedForms];

    if (filters.practiceArea) {
      filtered = filtered.filter(form => 
        (form.category || form.practice_area || '').toLowerCase().includes(filters.practiceArea.toLowerCase())
      );
    }

    if (filters.price === 'free') {
      filtered = filtered.filter(form => form.is_free);
    } else if (filters.price === 'paid') {
      filtered = filtered.filter(form => !form.is_free);
    }

    if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    setFilteredForms(filtered);
  };

  const clearFilters = () => {
    setFilters({ practiceArea: '', price: '', sortBy: '' });
    setFilteredForms(approvedForms);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, approvedForms]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Legal Forms & Attorney Directory",
    "description": "Access professional legal documents and connect with qualified attorneys across all practice areas.",
    "url": "https://legalcity.com/legal-forms",
    "mainEntity": {
      "@type": "Service",
      "name": "Legal Forms and Attorney Services",
      "provider": {
        "@type": "Organization",
        "name": "LegalCity"
      }
    }
  };



  return (
    <>
      <SEOHead 
        title="Legal Forms & Attorney Directory | LegalCity"
        description="Access professional legal documents and connect with qualified attorneys across all practice areas. Find the right lawyer for your legal needs."
        keywords="legal forms, attorney directory, legal documents, lawyers, legal services"
        canonical="https://legalcity.com/legal-forms"
        structuredData={structuredData}
      />

      {/* Hero Section - Matching Home Page */}
      <section className="relative w-full h-[500px] sm:h-[600px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <img
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80"
          srcSet="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=768&h=400&fit=crop&auto=format&q=80 768w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80 1440w"
          sizes="(max-width: 768px) 768px, 1440px"
          alt="Professional legal consultation - Legal forms and attorney directory"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          loading="eager"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

        <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-[700px] text-center">
            <h1 className="text-gray-900 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Legal Forms & <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">Attorney Directory</span>
            </h1>
            <p className="text-gray-700 text-xl sm:text-2xl mb-8 leading-relaxed font-medium">
              Access Professional Legal Documents and Connect with Top-Tier Attorneys Across All Practice Areas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/lawyers')}
                className="px-10 py-4 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Find Lawyers
              </button>
              <button
                onClick={() => navigate('/qa')}
                className="px-10 py-4 bg-white/90 backdrop-blur-md text-gray-800 font-bold rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border-2 border-gray-200 text-lg"
              >
                Ask Legal Question
              </button>
            </div>
          </div>
        </div>
      </section>



      {/* Filters Section */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-wrap items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Forms:</h3>
              
              <select 
                value={filters.practiceArea}
                onChange={(e) => handleFilterChange('practiceArea', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Practice Areas</option>
                <option value="business">Business Law</option>
                <option value="family">Family Law</option>
                <option value="real-estate">Real Estate</option>
                <option value="estate-planning">Estate Planning</option>
                <option value="personal-injury">Personal Injury</option>
              </select>
              
              <select 
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Prices</option>
                <option value="free">Free Forms</option>
                <option value="paid">Premium Forms</option>
              </select>
              
              <select 
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sort By</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              
              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Approved Forms from Database */}
      {!loading && filteredForms.length > 0 && (
        <section className="bg-white py-16 border-b">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#111827] mb-4">Available Legal Forms</h2>
              <p className="text-lg text-[#4B5563]">Download professional legal documents created by verified attorneys.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredForms.map((form) => (
                <div key={form.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col h-full">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{form.title}</h3>
                        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {form.category || form.practice_area}
                        </span>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${form.is_free ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                        {form.is_free ? 'FREE' : `$${form.price}`}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed flex-1">{form.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                        PDF Document
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0">
                    <button 
                      onClick={async () => {
                        if (form.file_url) {
                          try {
                            const response = await fetch(`${API_BASE_URL}/forms/download/${form.id}`);
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } else {
                              const errorData = await response.json();
                              toast.error(errorData.error || 'Failed to download form');
                            }
                          } catch (error) {
                            toast.error('Error downloading form. Please try again.');
                          }
                        } else {
                          toast.error('Form file not available');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Download Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Practice Areas */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Practice Areas</h2>
            <p className="text-lg text-gray-600">Find specialized attorneys across major legal areas.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Corporate Law', 'Family Law', 'Criminal Defense', 'Personal Injury', 'Real Estate', 'Estate Planning', 'Immigration', 'Employment Law'].map((area) => (
              <button
                key={area}
                onClick={() => navigate(`/lawyers?practice=${area}`)}
                className="bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg border shadow-sm hover:shadow-md transition-all text-sm"
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}