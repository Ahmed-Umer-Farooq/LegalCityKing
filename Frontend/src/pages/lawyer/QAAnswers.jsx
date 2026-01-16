import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toastUtils';

const QAAnswers = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast.warning('Please login first');
        return;
      }
      
      const response = await fetch('http://localhost:5001/api/qa/lawyer/questions?status=pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to fetch');
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error:', error);
      showToast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answer.trim() || answer.length < 10) {
      showToast.warning('Answer must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/qa/questions/${selectedQuestion.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer })
      });

      if (response.ok) {
        showToast.success('Answer submitted successfully!');
        setAnswer('');
        setShowAnswerModal(false);
        setSelectedQuestion(null);
        fetchQuestions();
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      showToast.error('Error submitting answer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Answer Legal Questions</h1>
        <p className="text-gray-600">Help users by providing professional legal insights</p>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No unanswered questions available at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new questions to answer.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {question.question}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>📍 {question.city_state}</span>
                  <span>👤 {question.user_display_name || 'Anonymous'}</span>
                  <span>📅 {formatDate(question.created_at)}</span>
                  <span>👁️ {question.views} views</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Situation Details:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{question.situation}</p>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Plans to hire attorney:</span>
                    <span className="ml-2 capitalize">{question.plan_hire_attorney.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Existing answers:</span>
                    <span className="ml-2">{question.answer_count}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedQuestion(question);
                    setShowAnswerModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Provide Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Modal */}
      {showAnswerModal && selectedQuestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Provide Your Answer</h3>
                <button
                  onClick={() => {
                    setShowAnswerModal(false);
                    setAnswer('');
                    setSelectedQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{selectedQuestion.question}</h4>
                <p className="text-blue-800 text-sm">{selectedQuestion.situation.substring(0, 200)}...</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Professional Answer *
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide your professional legal insight and advice..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  minLength={10}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    Minimum 10 characters required
                  </span>
                  <span className="text-sm text-gray-500">
                    {answer.length} characters
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnswerModal(false);
                    setAnswer('');
                    setSelectedQuestion(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnswerSubmit}
                  disabled={submitting || answer.length < 10}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAAnswers;