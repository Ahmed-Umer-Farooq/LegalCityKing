const express = require('express');
const router = express.Router();
const { authenticateToken, requireLawyer, authenticateLawyerSpecific } = require('../utils/middleware');
const {
  submitQuestion,
  getQuestions,
  getQuestionById,
  submitAnswer,
  getLawyerQuestions,
  getAdminQuestions,
  updateQuestionStatus,
  deleteQuestion,
  getQAStats
} = require('../controllers/qaController');

// Public routes
router.post('/questions', submitQuestion); // Allow anonymous submissions
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);

// Lawyer routes (require authentication and lawyer role)
router.get('/lawyer/questions', authenticateLawyerSpecific, requireLawyer, getLawyerQuestions);
// Temporary debug route
router.get('/debug/questions', (req, res) => {
  // Return all pending questions for debugging
  const db = require('../db');
  db('qa_questions')
    .where('status', 'pending')
    .select('*')
    .then(questions => {
      res.json({ questions, debug: true });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});
router.post('/questions/:questionId/answers', authenticateLawyerSpecific, requireLawyer, submitAnswer);

// Admin routes (for admin panel)
router.get('/admin/questions', getAdminQuestions);
router.get('/admin/stats', getQAStats);
router.put('/admin/questions/:id', updateQuestionStatus);
router.delete('/admin/questions/:id', deleteQuestion);

module.exports = router;