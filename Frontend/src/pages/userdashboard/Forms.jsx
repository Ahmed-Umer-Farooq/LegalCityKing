import React from 'react';
import { useNavigate } from 'react-router-dom';

const Forms = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section - Matching Home Page */}
      <section className="relative w-full h-[500px] sm:h-[600px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <img
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80"
          srcSet="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=768&h=400&fit=crop&auto=format&q=80 768w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80 1440w"
          sizes="(max-width: 768px) 768px, 1440px"
          alt="Professional legal consultation - Legal forms and attorney directory"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          loading="eager"
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

      {/* Legal Forms - Simplified */}
      <section className="bg-[#F9FAFB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111827] mb-4">Professional Legal Forms</h2>
            <p className="text-lg text-[#4B5563]">Attorney-reviewed documents ready for immediate use.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4">Business Forms</h3>
              <ul className="space-y-2 mb-6 text-sm">
                <li>• LLC operating agreement</li>
                <li>• Partnership agreement</li>
                <li>• Independent contractor agreement</li>
                <li>• Non-disclosure agreement</li>
              </ul>
              <button
                onClick={() => navigate('/forms/business')}
                className="w-full bg-[#2973FF] hover:bg-[#1F5AD1] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Browse Forms
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4">Estate Planning</h3>
              <ul className="space-y-2 mb-6 text-sm">
                <li>• Last will and testament</li>
                <li>• Living trust</li>
                <li>• Power of attorney</li>
                <li>• Healthcare directive</li>
              </ul>
              <button
                onClick={() => navigate('/forms/estate-planning')}
                className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Browse Forms
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4">Real Estate</h3>
              <ul className="space-y-2 mb-6 text-sm">
                <li>• Residential lease agreement</li>
                <li>• Commercial lease</li>
                <li>• Purchase agreement</li>
                <li>• Termination notice</li>
              </ul>
              <button
                onClick={() => navigate('/forms/real-estate')}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Browse Forms
              </button>
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

      {/* Practice Areas - Simplified */}
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
};

export default Forms;