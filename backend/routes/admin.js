const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../utils/middleware');
const {
  getStats,
  getUsers,
  getLawyers,
  verifyLawyer,
  rejectLawyer,
  deleteUser,
  deleteLawyer,
  makeAdmin,
  removeAdmin,
  getAllChatMessages,
  getActivityLogs
} = require('../controllers/adminController');
const { requireAdmin } = require('../utils/middleware');

// All routes require admin authentication
router.use(authenticateToken);
// Note: Individual routes will use requireAdmin middleware

// Dashboard statistics
console.log('🔍 Registering /stats route');
router.get('/stats', requireAdmin, (req, res) => {
  console.log('📊 Admin stats endpoint hit');
  getStats(req, res);
});

// User management
router.get('/users', getUsers);
router.get('/users/all', async (req, res) => {
  try {
    const users = await require('../db')('users')
      .select('id', 'name', 'email', 'mobile_number', 'role', 'is_verified', 'is_active', 'google_id', 'created_at')
      .orderBy('created_at', 'desc');
    
    console.log('All users debug:', users.length, 'users found');
    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
router.delete('/users/:id', deleteUser);
router.put('/users/:id/make-admin', makeAdmin);
router.put('/users/:id/remove-admin', removeAdmin);

// Lawyer management
router.get('/lawyers', getLawyers);
router.put('/verify-lawyer/:id', verifyLawyer);
router.put('/reject-lawyer/:id', rejectLawyer);
router.delete('/lawyers/:id', deleteLawyer);

// Chat management
router.get('/chat-messages', getAllChatMessages);

// Activity logs
router.get('/activity-logs', getActivityLogs);

// Q&A Management
router.get('/qa/questions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../db');

    let query = db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name',
        db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count')
      );

    if (status !== 'all') {
      if (status === 'answered') {
        query = query.where('qa_questions.is_answered', 1);
      } else if (status === 'pending') {
        query = query.where('qa_questions.is_answered', 0);
      }
    }

    if (search) {
      query = query.where(function() {
        this.where('qa_questions.question', 'like', `%${search}%`)
            .orWhere('qa_questions.situation', 'like', `%${search}%`)
            .orWhere('qa_questions.city_state', 'like', `%${search}%`)
            .orWhere('users.name', 'like', `%${search}%`)
            .orWhere('qa_questions.user_email', 'like', `%${search}%`);
      });
    }

    const questions = await query
      .orderBy('qa_questions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const totalCount = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .modify(function(queryBuilder) {
        if (status !== 'all') {
          if (status === 'answered') {
            queryBuilder.where('qa_questions.is_answered', 1);
          } else if (status === 'pending') {
            queryBuilder.where('qa_questions.is_answered', 0);
          }
        }
        if (search) {
          queryBuilder.where(function() {
            this.where('qa_questions.question', 'like', `%${search}%`)
                .orWhere('qa_questions.situation', 'like', `%${search}%`)
                .orWhere('qa_questions.city_state', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`)
                .orWhere('qa_questions.user_email', 'like', `%${search}%`);
          });
        }
      })
      .count('qa_questions.id as count')
      .first();

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin Q&A questions:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A questions' });
  }
});

router.get('/qa/stats', requireAdmin, async (req, res) => {
  try {
    const db = require('../db');
    const [totalQuestions, pendingQuestions, answeredQuestions, totalAnswers] = await Promise.all([
      db('qa_questions').count('id as count').first(),
      db('qa_questions').where('is_answered', 0).count('id as count').first(),
      db('qa_questions').where('is_answered', 1).count('id as count').first(),
      db('qa_answers').count('id as count').first()
    ]);

    const recentQuestions = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.id',
        'qa_questions.question',
        'qa_questions.is_answered',
        'qa_questions.created_at',
        'users.name as user_name'
      )
      .orderBy('qa_questions.created_at', 'desc')
      .limit(5);

    res.json({
      stats: {
        totalQuestions: totalQuestions.count,
        pendingQuestions: pendingQuestions.count,
        answeredQuestions: answeredQuestions.count,
        closedQuestions: 0, // Not applicable with current schema
        totalAnswers: totalAnswers.count
      },
      recentQuestions
    });
  } catch (error) {
    console.error('Error fetching Q&A stats:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A statistics' });
  }
});

router.put('/qa/questions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_public } = req.body;
    const db = require('../db');

    const updateData = {};
    if (status) {
      if (status === 'answered') {
        updateData.is_answered = 1;
      } else if (status === 'pending') {
        updateData.is_answered = 0;
      }
    }
    if (typeof is_public === 'boolean') updateData.is_public = is_public;

    await db('qa_questions').where('id', id).update(updateData);

    const updatedQuestion = await db('qa_questions').where('id', id).first();
    
    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating Q&A question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/qa/questions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../db');

    await db('qa_answers').where('question_id', id).del();
    const deleted = await db('qa_questions').where('id', id).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting Q&A question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Call history for admin - get all calls
router.get('/call-history', async (req, res) => {
  try {
    const db = require('../db');
    const calls = await db('call_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    console.log('Admin call history query result:', calls.length, 'calls found');
    res.json(calls);
  } catch (error) {
    console.error('Error fetching admin call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Platform Reviews Management
router.get('/platform-reviews', async (req, res) => {
  try {
    const db = require('../db');
    const reviews = await db('platform_reviews')
      .leftJoin('lawyers', 'platform_reviews.lawyer_id', 'lawyers.id')
      .select(
        'platform_reviews.*',
        'lawyers.name as lawyer_name'
      )
      .orderBy('platform_reviews.created_at', 'desc');

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching platform reviews:', error);
    res.status(500).json({ error: 'Failed to fetch platform reviews' });
  }
});

router.put('/platform-reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, is_featured } = req.body;
    const db = require('../db');

    await db('platform_reviews')
      .where({ id })
      .update({ is_approved, is_featured });

    res.json({ message: 'Review status updated successfully' });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

module.exports = router;
