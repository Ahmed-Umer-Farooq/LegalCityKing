import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, User, Calendar, Eye } from 'lucide-react';

const QA = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('browse'); // 'browse' or 'ask'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Form state
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
      question: { minLength: 5, maxLength: 200, required: true },
      situation: { maxLength: 1200, required: true },
      city_state: { 
        pattern: /^[A-Za-z .'-]+,\s*[A-Za-z]{2}$/,
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
      return 'Please enter city and 2-letter state code (e.g., Seattle, WA)';
    }

    return '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
        body: JSON.stringify({
          ...formData,
          user_email: user?.email,
          user_name: user?.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Question submitted successfully! Attorneys will respond soon.');
        setFormData({
          question: '',
          situation: '',
          city_state: '',
          plan_hire_attorney: ''
        });
        setShowPreview(false);
        setActiveView('browse');
        fetchQuestions();
      } else {
        alert(data.error || 'Error submitting question. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Error submitting question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      answered: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && Object.keys(errors).length === 0;

  if (showPreview) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Preview Your Question</h1>
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
    <div className="p-4 lg:p-6">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Legal Q&A</h1>
        <p className="text-sm lg:text-base text-gray-600">Ask questions and get expert legal advice from qualified attorneys</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-4 lg:mb-6">
        <nav className="flex space-x-4 lg:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveView('browse')}
            className={`py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
              activeView === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Questions
          </button>
          <button
            onClick={() => setActiveView('ask')}
            className={`py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
              activeView === 'ask'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ask a Question
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeView === 'browse' ? (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Community Questions</h2>
            <button
              onClick={() => setActiveView('ask')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ask a Question
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg mb-4">No questions found. Be the first to ask!</p>
                  <button
                    onClick={() => setActiveView('ask')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Ask the First Question
                  </button>
                </div>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-3 lg:gap-0 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                          {question.question}
                        </h3>
                        <p className="text-sm lg:text-base text-gray-600 mb-3 line-clamp-2">
                          {question.situation.substring(0, 200)}...
                        </p>
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 lg:w-4 lg:h-4" /> {question.city_state}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3 lg:w-4 lg:h-4" /> {question.user_display_name || 'Anonymous'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 lg:w-4 lg:h-4" /> {formatDate(question.created_at)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3 lg:w-4 lg:h-4" /> {question.views} views</span>
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2">
                        {getStatusBadge(question.status)}
                        {question.answer_count > 0 && (
                          <span className="text-xs lg:text-sm text-gray-500">
                            {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs lg:text-sm text-gray-500">
                        Plans to hire attorney: <span className="capitalize">{question.plan_hire_attorney.replace('_', ' ')}</span>
                      </div>
                      <button
                        onClick={() => fetchQuestionDetails(question.secure_id || question.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* Ask Question Form */
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <button
                onClick={() => setActiveView('browse')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Questions
              </button>
            </div>
            
            <form className="space-y-6">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
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
                  placeholder="Example: Seattle, WA"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
                  className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Detail Modal */}
      {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full sm:w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Question */}
                <div className="bg-blue-50 p-4 sm:p-6 rounded-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-4">
                    <h4 className="text-base sm:text-xl font-semibold text-blue-900">{selectedQuestion.question}</h4>
                    {getStatusBadge(selectedQuestion.status)}
                  </div>
                  <p className="text-sm sm:text-base text-blue-800 mb-4 whitespace-pre-wrap">{selectedQuestion.situation}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-700">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {selectedQuestion.city_state}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3 sm:w-4 sm:h-4" /> {selectedQuestion.user_display_name || 'Anonymous'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> {formatDate(selectedQuestion.created_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3 sm:w-4 sm:h-4" /> {selectedQuestion.views} views</span>
                  </div>
                </div>

                {/* Answers */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Answers ({questionAnswers.length})
                  </h4>
                  {questionAnswers.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                      <p className="text-sm sm:text-base text-gray-500">No answers yet. Be the first lawyer to answer!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {questionAnswers.map((answer) => (
                        <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm sm:text-base">⚖️</span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{answer.lawyer_name}</h5>
                                <p className="text-xs sm:text-sm text-gray-500">{answer.speciality}</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <div className="text-xs sm:text-sm text-gray-500">{formatDate(answer.created_at)}</div>
                              {answer.is_best_answer && (
                                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  ✓ Best Answer
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap">{answer.answer}</p>

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
  );
};

export default QA;