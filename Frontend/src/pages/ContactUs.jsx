import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEOHead from '../components/SEOHead';

const ContactUs = () => {
  const navigate = useNavigate();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Legal City",
    "description": "Contact our experienced legal professionals for comprehensive legal services and exceptional results.",
    "url": "https://legalcity.com/contact-us",
    "mainEntity": {
      "@type": "LegalService",
      "name": "Legal City Contact",
      "provider": {
        "@type": "Organization",
        "name": "LegalCity"
      }
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    legalArea: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const legalAreas = [
    'Corporate Law', 'Criminal Defense', 'Family Law', 'Personal Injury',
    'Real Estate', 'Immigration', 'Employment Law', 'Intellectual Property',
    'Tax Law', 'Estate Planning', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/contact-submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Thank you for contacting Legal City. Your message has been received and our team will respond within 24 hours.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '', legalArea: '' });
      } else {
        toast.error('Failed to submit your message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit your message. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <SEOHead 
        title="Contact Legal City | Professional Legal Services"
        description="Contact our experienced legal professionals for comprehensive legal services. Get expert legal consultation and exceptional results for your case."
        keywords="contact lawyer, legal consultation, attorney contact, legal services, professional legal help"
        canonical="https://legalcity.com/contact-us"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Matching Home Page */}
        <section className="relative w-full h-[500px] sm:h-[600px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80"
            srcSet="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=768&h=400&fit=crop&auto=format&q=80 768w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80 1440w"
            sizes="(max-width: 768px) 768px, 1440px"
            alt="Professional legal consultation - Contact Legal City"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

          <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
            <div className="w-full max-w-[700px] text-center">
              <h1 className="text-gray-900 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Contact <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">Legal City</span>
              </h1>
              <p className="text-gray-700 text-xl sm:text-2xl mb-8 leading-relaxed font-medium">
                Connect with Experienced Legal Professionals for Comprehensive Legal Services and Exceptional Results.
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
                  Ask Question
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-16">

          {/* Trust Indicators - Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confidential Consultation</h3>
              <p className="text-gray-600">All communications protected by attorney-client privilege</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Legal Team</h3>
              <p className="text-gray-600">500+ qualified attorneys across multiple practice areas</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proven Track Record</h3>
              <p className="text-gray-600">10,000+ legal cases resolved nationwide</p>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Phone Numbers</h3>
                  <p className="text-gray-600 mb-1">Main Office: +1 (555) 123-4567</p>
                  <p className="text-gray-600">Emergency: +1 (555) 987-6543</p>
                  <p className="text-sm text-blue-600 mt-1">Available 24/7 for urgent matters</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email Addresses</h3>
                  <p className="text-gray-600 mb-1">General: info@legalcity.com</p>
                  <p className="text-gray-600 mb-1">New Clients: intake@legalcity.com</p>
                  <p className="text-gray-600">Support: support@legalcity.com</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Office Location</h3>
                  <p className="text-gray-600">Legal City Professional Center<br />1250 Broadway, Suite 3600<br />New York, NY 10001</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Office Hours</h3>
                  <p className="text-gray-600 mb-1">Monday - Friday: 8:00 AM - 7:00 PM</p>
                  <p className="text-gray-600 mb-1">Saturday: 9:00 AM - 5:00 PM</p>
                  <p className="text-gray-600">Sunday: By appointment only</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Connect With Us</h2>
              <div className="space-y-3">
                <a href="https://linkedin.com/company/legalcity" target="_blank" rel="noopener noreferrer"
                   className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="font-semibold text-gray-900">LinkedIn</span>
                  <p className="text-sm text-gray-600">Professional updates & legal insights</p>
                </a>
                
                <a href="https://twitter.com/legalcity" target="_blank" rel="noopener noreferrer"
                   className="block p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                  <span className="font-semibold text-gray-900">Twitter</span>
                  <p className="text-sm text-gray-600">Legal news & industry updates</p>
                </a>
                
                <a href="https://facebook.com/legalcity" target="_blank" rel="noopener noreferrer" 
                   className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="font-semibold text-gray-900">Facebook</span>
                  <p className="text-sm text-gray-600">Community engagement & events</p>
                </a>
              </div>
            </div>
          </div>

          {/* Professional Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Request Legal Consultation</h2>
                <p className="text-gray-600">Fill out the form below and our legal team will contact you within 24 hours to discuss your case.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.name ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="legalArea" className="block text-sm font-semibold text-gray-700 mb-2">
                      Legal Area
                    </label>
                    <select
                      id="legalArea"
                      name="legalArea"
                      value={formData.legalArea}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all"
                    >
                      <option value="">Select legal area</option>
                      {legalAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.subject ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Brief description of your legal matter"
                  />
                  {errors.subject && <p className="text-red-500 text-sm mt-2">{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Detailed Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                      errors.message ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Please provide details about your legal situation, including relevant dates, parties involved, and specific questions you have..."
                  />
                  {errors.message && <p className="text-red-500 text-sm mt-2">{errors.message}</p>}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Confidentiality Guarantee</p>
                    <p>All information shared is protected by attorney-client privilege and kept strictly confidential.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? 'Sending Your Request...' : 'Request Legal Consultation'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Why Choose Legal City */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Legal City?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">We are committed to providing exceptional legal services with integrity, expertise, and personalized attention.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Qualified Attorneys</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Cases Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Emergency Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Client Satisfaction</div>
            </div>
          </div>
        </div>
          {/* Office Location - Simplified */}
          <div className="mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Visit Our Office</h2>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-60 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-2">Legal City Professional Center</p>
                  <p className="text-gray-600">1250 Broadway, Suite 3600<br />New York, NY 10001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;