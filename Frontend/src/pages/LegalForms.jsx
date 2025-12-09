import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import api from '../utils/api';

export default function LegalForms() {
  const navigate = useNavigate();
  const [approvedForms, setApprovedForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedForms();
  }, []);

  const fetchApprovedForms = async () => {
    try {
      const response = await api.get('/forms/public');
      setApprovedForms(response.data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

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



      {/* Trust Indicators - Simplified */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-900">50,000+</div>
              <div className="text-sm text-gray-600">Verified Attorneys</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-900">&lt; 2hrs</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-900">$5.2B+</div>
              <div className="text-sm text-gray-600">Cases Won</div>
            </div>
          </div>
        </div>
      </section>

      {/* Approved Forms from Database */}
      {!loading && approvedForms.length > 0 && (
        <section className="bg-white py-16 border-b">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#111827] mb-4">Available Legal Forms</h2>
              <p className="text-lg text-[#4B5563]">Download professional legal documents created by verified attorneys.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedForms.map((form) => (
                <div key={form.id} className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{form.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${form.is_free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {form.is_free ? 'Free' : `$${form.price}`}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{form.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-3 py-1 rounded">{form.category || form.practice_area}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (form.file_url) {
                        window.open(`http://localhost:5001${form.file_url}`, '_blank');
                      } else {
                        alert('Form file not available');
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Download Form
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Legal Forms by Practice Area */}
      <section className="bg-[#F9FAFB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111827] mb-4">Legal Forms by Practice Area</h2>
            <p className="text-lg text-[#4B5563]">Professional legal documents organized by specialty areas.</p>
          </div>
          
          <div className="space-y-12">
            {/* Business Law Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-[#111827] mb-6 border-b border-gray-200 pb-3">Business Law</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">LLC Operating Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Establish business structure and operations</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">Partnership Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Define partnership terms and responsibilities</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">Non-Disclosure Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Protect confidential business information</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">Employment Contract</div>
                  <div className="text-sm text-gray-600 mt-1">Standard employee agreement template</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">Independent Contractor Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Freelancer and contractor terms</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#2973FF]">Business Purchase Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Buy or sell business assets</div>
                </button>
              </div>
            </div>

            {/* Family Law Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-[#111827] mb-6 border-b border-gray-200 pb-3">Family Law</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Divorce Petition</div>
                  <div className="text-sm text-gray-600 mt-1">Initiate divorce proceedings</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Child Custody Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Establish custody arrangements</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Child Support Modification</div>
                  <div className="text-sm text-gray-600 mt-1">Request support amount changes</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Prenuptial Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Pre-marriage financial protection</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Adoption Papers</div>
                  <div className="text-sm text-gray-600 mt-1">Legal adoption documentation</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#7C3AED]">Separation Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Legal separation terms</div>
                </button>
              </div>
            </div>

            {/* Real Estate Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-[#111827] mb-6 border-b border-gray-200 pb-3">Real Estate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Residential Lease Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Standard rental property lease</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Commercial Lease</div>
                  <div className="text-sm text-gray-600 mt-1">Business property rental agreement</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Purchase Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Property buying contract</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Eviction Notice</div>
                  <div className="text-sm text-gray-600 mt-1">Tenant removal documentation</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Property Deed Transfer</div>
                  <div className="text-sm text-gray-600 mt-1">Transfer property ownership</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#10B981]">Landlord-Tenant Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Rental terms and conditions</div>
                </button>
              </div>
            </div>

            {/* Estate Planning Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-[#111827] mb-6 border-b border-gray-200 pb-3">Estate Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Last Will and Testament</div>
                  <div className="text-sm text-gray-600 mt-1">Distribute assets after death</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Living Trust</div>
                  <div className="text-sm text-gray-600 mt-1">Manage assets during lifetime</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Power of Attorney</div>
                  <div className="text-sm text-gray-600 mt-1">Authorize legal decision-making</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Healthcare Directive</div>
                  <div className="text-sm text-gray-600 mt-1">Medical treatment preferences</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Guardianship Papers</div>
                  <div className="text-sm text-gray-600 mt-1">Legal guardianship documentation</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#F59E0B]">Estate Inventory</div>
                  <div className="text-sm text-gray-600 mt-1">List and value estate assets</div>
                </button>
              </div>
            </div>

            {/* Personal Injury Forms */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h3 className="text-2xl font-bold text-[#111827] mb-6 border-b border-gray-200 pb-3">Personal Injury</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Accident Report Form</div>
                  <div className="text-sm text-gray-600 mt-1">Document incident details</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Medical Records Request</div>
                  <div className="text-sm text-gray-600 mt-1">Obtain medical documentation</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Insurance Claim Form</div>
                  <div className="text-sm text-gray-600 mt-1">File insurance compensation claim</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Settlement Agreement</div>
                  <div className="text-sm text-gray-600 mt-1">Finalize injury compensation</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Witness Statement</div>
                  <div className="text-sm text-gray-600 mt-1">Record witness testimony</div>
                </button>
                <button className="text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="font-semibold text-[#EF4444]">Demand Letter</div>
                  <div className="text-sm text-gray-600 mt-1">Request compensation payment</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Simplified */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Legal Services</h2>
            <p className="text-lg text-gray-600">Connect with the right legal expertise for your needs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Legal Consultation</h3>
              <p className="text-gray-600 mb-4">Get expert advice from qualified attorneys.</p>
              <button className="w-full bg-[#2973FF] hover:bg-[#1F5AD1] text-white font-semibold py-3 rounded-lg transition-colors">
                Schedule Consultation
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Document Review</h3>
              <p className="text-gray-600 mb-4">Professional review of legal documents.</p>
              <button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 rounded-lg transition-colors">
                Upload Document
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Legal Representation</h3>
              <p className="text-gray-600 mb-4">Full representation for complex matters.</p>
              <button className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-semibold py-3 rounded-lg transition-colors">
                Find Attorney
              </button>
            </div>
          </div>
        </div>
      </section>

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