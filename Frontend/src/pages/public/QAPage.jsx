import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEOHead from '../../components/SEOHead';

const QAPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ask'); // 'ask' or 'browse'

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Free Legal Q&A with Attorneys",
    "description": "Submit your legal question to get expert attorney insights. Free, confidential legal advice from qualified professionals.",
    "url": "https://legalcity.com/qa",
    "mainEntity": {
      "@type": "Service",
      "name": "Legal Q&A Service",
      "provider": {
        "@type": "Organization",
        "name": "LegalCity"
      }
    }
  };
  const [formData, setFormData] = useState({
    question: '',
    situation: '',
    city_state: '',
    plan_hire_attorney: ''
  });
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/qa/questions');
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetails = async (questionId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/qa/questions/${questionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedQuestion(data.question);
        setQuestionAnswers(data.answers || []);
        setShowQuestionModal(true);
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
    }
  };

  const validateField = (field, value) => {
    const constraints = {
      question: { minLength: 10, maxLength: 200, required: true },
      situation: { minLength: 20, maxLength: 1200, required: true },
      city_state: { 
        pattern: /^[A-Za-z .'-]+,\s*[A-Za-z\s]+$/,
        maxLength: 64,
        required: true
      },
      plan_hire_attorney: { required: true }
    };

    const constraint = constraints[field];
    if (!constraint) return '';

    if (constraint.required && !value.trim()) {
      return `${field.replace('_', ' ')} is required`;
    }

    if (constraint.minLength && value.length < constraint.minLength) {
      return `Minimum ${constraint.minLength} characters required`;
    }

    if (constraint.maxLength && value.length > constraint.maxLength) {
      return `Maximum ${constraint.maxLength} characters allowed`;
    }

    if (constraint.pattern && !constraint.pattern.test(value)) {
      return 'Please enter city and state (e.g., Seattle, WA)';
    }

    return '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field and update errors immediately
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
      // Scroll to top when showing preview
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/qa/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Question submitted successfully! Attorneys will respond soon.');
        setFormData({
          question: '',
          situation: '',
          city_state: '',
          plan_hire_attorney: ''
        });
        setShowPreview(false);
      } else {
        toast.error(data.error || 'Error submitting question. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Error submitting question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && 
    Object.values(errors).every(error => !error) &&
    validateField('question', formData.question) === '' &&
    validateField('situation', formData.situation) === '' &&
    validateField('city_state', formData.city_state) === '';

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Preview Your Question</h1>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Your Question</h3>
                <p className="text-blue-800">{formData.question}</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Situation Details</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.situation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-900 mb-1">Location</h3>
                  <p className="text-green-800">{formData.city_state}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-900 mb-1">Hiring Plans</h3>
                  <p className="text-purple-800 capitalize">{formData.plan_hire_attorney.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Question
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Free Legal Q&A with Attorneys | LegalCity"
        description="Submit your legal question to get expert attorney insights. Free, confidential legal advice from qualified professionals across all practice areas."
        keywords="legal questions, attorney advice, free legal help, legal Q&A, lawyer consultation"
        canonical="https://legalcity.com/qa"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Matching Home Page */}
        <section className="relative w-full h-[500px] sm:h-[600px] bg-gradient-to-br from-blue-50 via-white to-gray-50">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80"
            srcSet="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=768&h=400&fit=crop&auto=format&q=80 768w, https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1440&h=600&fit=crop&auto=format&q=80 1440w"
            sizes="(max-width: 768px) 768px, 1440px"
            alt="Professional legal consultation - Free Q&A with attorneys"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80" />

          <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
            <div className="w-full max-w-[700px] text-center">
              <h1 className="text-gray-900 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Free <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] bg-clip-text text-transparent">Legal Q&A</span>
              </h1>
              <p className="text-gray-700 text-xl sm:text-2xl mb-8 leading-relaxed font-medium">
                Submit Your Legal Question to Get Expert Attorney Insights. Free, Confidential, and Professional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/lawyers')}
                  className="px-10 py-4 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
                >
                  Find Lawyers
                </button>
                <button
                  onClick={() => navigate('/legal-forms')}
                  className="px-10 py-4 bg-white/90 backdrop-blur-md text-gray-800 font-bold rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border-2 border-gray-200 text-lg"
                >
                  Legal Forms
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8 justify-center">
                <button
                  onClick={() => setActiveTab('ask')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ask'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ask a Question
                </button>
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'browse'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Browse Questions & Answers
                </button>
              </nav>
            </div>

            {activeTab === 'ask' ? (
              <div className="bg-white rounded-2xl shadow-xl p-8">
              <form className="space-y-8">
                {/* Question Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ask your question *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => handleInputChange('question', e.target.value)}
                    placeholder="Summarize your legal question in one sentence"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.question ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={200}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.question && (
                      <span className="text-red-500 text-sm">
                        {errors.question}
                      </span>
                    )}
                    <span className="text-gray-500 text-sm ml-auto">
                      {formData.question.length}/200
                    </span>
                  </div>
                </div>

                {/* Situation Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Explain your situation *
                  </label>
                  <textarea
                    value={formData.situation}
                    onChange={(e) => handleInputChange('situation', e.target.value)}
                    placeholder="Include facts, timelines, and what you've already tried"
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                      errors.situation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={1200}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.situation && (
                      <span className="text-red-500 text-sm">
                        {errors.situation}
                      </span>
                    )}
                    <span className="text-gray-500 text-sm ml-auto">
                      {formData.situation.length}/1200
                    </span>
                  </div>
                </div>

                {/* City State Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    City and state *
                  </label>
                  <input
                    type="text"
                    value={formData.city_state}
                    onChange={(e) => handleInputChange('city_state', e.target.value)}
                    placeholder="Enter your city and state"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.city_state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={64}
                  />
                  {errors.city_state && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.city_state}
                    </span>
                  )}
                </div>

                {/* Plan to Hire Attorney */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Do you plan to hire an attorney? *
                  </label>
                  <div className="flex gap-6">
                    {[
                      { value: 'yes', label: 'Yes' },
                      { value: 'not_sure', label: 'Not Sure' },
                      { value: 'no', label: 'No' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="plan_hire_attorney"
                          value={option.value}
                          checked={formData.plan_hire_attorney === option.value}
                          onChange={(e) => handleInputChange('plan_hire_attorney', e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.plan_hire_attorney && (
                    <span className="text-red-500 text-sm mt-2">
                      {errors.plan_hire_attorney}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!isFormValid}
                    className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview Question
                  </button>
                </div>
              </form>
            </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Questions & Answers</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-lg mb-4">No questions found yet.</p>
                        <button
                          onClick={() => setActiveTab('ask')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Ask the First Question
                        </button>
                      </div>
                    ) : (
                      questions.map((question) => (
                        <div key={question.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {question.question}
                              </h3>
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {question.situation.substring(0, 200)}...
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>📍 {question.city_state}</span>
                                <span>👤 {question.user_display_name || 'Anonymous'}</span>
                                <span>📅 {new Date(question.created_at).toLocaleDateString()}</span>
                                <span>👁️ {question.views} views</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                question.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                question.status === 'answered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                              </span>
                              {question.answer_count > 0 && (
                                <span className="text-sm text-gray-500">
                                  {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Plans to hire attorney: <span className="capitalize">{question.plan_hire_attorney.replace('_', ' ')}</span>
                            </div>
                            <button
                              onClick={() => fetchQuestionDetails(question.secure_id || question.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Answers
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Question Detail Modal */}
        {showQuestionModal && selectedQuestion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Question & Answers</h3>
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Question */}
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h4 className="text-xl font-semibold text-blue-900 mb-4">{selectedQuestion.question}</h4>
                    <p className="text-blue-800 mb-4 whitespace-pre-wrap">{selectedQuestion.situation}</p>
                    <div className="flex items-center space-x-4 text-sm text-blue-700">
                      <span>📍 {selectedQuestion.city_state}</span>
                      <span>👤 {selectedQuestion.user_display_name || 'Anonymous'}</span>
                      <span>📅 {new Date(selectedQuestion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Answers */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Professional Answers ({questionAnswers.length})
                    </h4>
                    {questionAnswers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No answers yet. Lawyers will respond soon!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {questionAnswers.map((answer) => (
                          <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">⚖️</span>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{answer.lawyer_name}</h5>
                                  <p className="text-sm text-gray-500">{answer.speciality}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">{new Date(answer.created_at).toLocaleDateString()}</div>
                                {answer.is_best_answer && (
                                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    ✓ Best Answer
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{answer.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QAPage;