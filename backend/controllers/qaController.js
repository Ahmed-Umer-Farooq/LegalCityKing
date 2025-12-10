const db = require('../db');
const crypto = require('crypto');

// Generate secure ID for questions
const generateSecureId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Submit a new question
const submitQuestion = async (req, res) => {
  try {
    const { question, situation, city_state, plan_hire_attorney, user_email, user_name } = req.body;
    
    // Validation
    if (!question || !situation || !city_state || !plan_hire_attorney) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (question.length < 5 || question.length > 200) {
      return res.status(400).json({ error: 'Question must be between 5 and 200 characters' });
    }

    if (situation.length > 1200) {
      return res.status(400).json({ error: 'Situation description must be under 1200 characters' });
    }

    const cityStatePattern = /^[A-Za-z .'-]+,\s*[A-Za-z]{2}$/;
    if (!cityStatePattern.test(city_state)) {
      return res.status(400).json({ error: 'Please enter city and 2-letter state code (e.g., Seattle, WA)' });
    }

    const secure_id = generateSecureId();
    const user_id = req.user ? req.user.id : null;

    const [questionId] = await db('qa_questions').insert({
      secure_id,
      question,
      situation,
      city_state,
      plan_hire_attorney,
      user_id,
      user_email: user_email || (req.user ? req.user.email : null),
      user_name: user_name || (req.user ? req.user.name : null),
      status: 'pending',
      is_public: true,
      views: 0,
      likes: 0
    });

    const newQuestion = await db('qa_questions').where('id', questionId).first();

    res.status(201).json({
      message: 'Question submitted successfully',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error submitting question:', error);
    res.status(500).json({ error: 'Failed to submit question' });
  }
};

// Get all questions (public view)
const getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name',
        db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count')
      )
      .where('qa_questions.is_public', true);

    if (status !== 'all') {
      query = query.where('qa_questions.status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('qa_questions.question', 'like', `%${search}%`)
            .orWhere('qa_questions.situation', 'like', `%${search}%`)
            .orWhere('qa_questions.city_state', 'like', `%${search}%`);
      });
    }

    const questions = await query
      .orderBy('qa_questions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const totalCount = await db('qa_questions')
      .where('is_public', true)
      .modify(function(queryBuilder) {
        if (status !== 'all') {
          queryBuilder.where('status', status);
        }
        if (search) {
          queryBuilder.where(function() {
            this.where('question', 'like', `%${search}%`)
                .orWhere('situation', 'like', `%${search}%`)
                .orWhere('city_state', 'like', `%${search}%`);
          });
        }
      })
      .count('id as count')
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
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get single question with answers
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find by secure_id or regular id
    const question = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name'
      )
      .where(function() {
        this.where('qa_questions.secure_id', id)
            .orWhere('qa_questions.id', id);
      })
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment view count
    await db('qa_questions').where('id', question.id).increment('views', 1);

    // Get answers with lawyer info
    const answers = await db('qa_answers')
      .join('lawyers', 'qa_answers.lawyer_id', 'lawyers.id')
      .select(
        'qa_answers.*',
        'lawyers.name as lawyer_name',
        'lawyers.speciality',
        'lawyers.profile_image'
      )
      .where('qa_answers.question_id', question.id)
      .orderBy('qa_answers.is_best_answer', 'desc')
      .orderBy('qa_answers.likes', 'desc')
      .orderBy('qa_answers.created_at', 'asc');

    res.json({
      question: { ...question, views: question.views + 1 },
      answers
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

// Submit answer (lawyer only)
const submitAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const lawyer_id = req.user.id;

    if (!answer || answer.trim().length < 10) {
      return res.status(400).json({ error: 'Answer must be at least 10 characters long' });
    }

    // Verify question exists
    const question = await db('qa_questions').where('id', questionId).first();
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if lawyer already answered this question
    const existingAnswer = await db('qa_answers')
      .where({ question_id: questionId, lawyer_id })
      .first();

    if (existingAnswer) {
      return res.status(400).json({ error: 'You have already answered this question' });
    }

    const [answerId] = await db('qa_answers').insert({
      question_id: questionId,
      lawyer_id,
      answer: answer.trim(),
      is_best_answer: false,
      likes: 0
    });

    // Update question status to answered if it was pending
    if (question.status === 'pending') {
      await db('qa_questions').where('id', questionId).update({ status: 'answered' });
    }

    const newAnswer = await db('qa_answers')
      .join('lawyers', 'qa_answers.lawyer_id', 'lawyers.id')
      .select(
        'qa_answers.*',
        'lawyers.name as lawyer_name',
        'lawyers.speciality',
        'lawyers.profile_image'
      )
      .where('qa_answers.id', answerId)
      .first();

    res.status(201).json({
      message: 'Answer submitted successfully',
      answer: newAnswer
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Get questions for lawyer dashboard
const getLawyerQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;
    const lawyer_id = req.user.id;

    console.log('🔍 Lawyer Questions Debug:', {
      lawyer_id,
      status,
      user: req.user
    });

    // Get questions that lawyer hasn't answered yet
    const questions = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name',
        db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count'),
        db.raw(`(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id AND qa_answers.lawyer_id = ${lawyer_id}) as my_answer_count`)
      )
      .where('qa_questions.status', status)
      .havingRaw('my_answer_count = 0')
      .orderBy('qa_questions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    console.log('📊 Found questions:', questions.length);

    const totalCount = await db('qa_questions')
      .leftJoin('qa_answers', function() {
        this.on('qa_questions.id', '=', 'qa_answers.question_id')
            .andOn('qa_answers.lawyer_id', '=', db.raw('?', [lawyer_id]));
      })
      .where('qa_questions.status', status)
      .whereNull('qa_answers.id')
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
    console.error('Error fetching lawyer questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Admin functions
const getAdminQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.*',
        'users.name as user_display_name',
        db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count')
      );

    if (status !== 'all') {
      query = query.where('qa_questions.status', status);
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
          queryBuilder.where('qa_questions.status', status);
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
    console.error('Error fetching admin questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

const updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_public } = req.body;

    const validStatuses = ['pending', 'answered', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (typeof is_public === 'boolean') updateData.is_public = is_public;

    await db('qa_questions').where('id', id).update(updateData);

    const updatedQuestion = await db('qa_questions').where('id', id).first();
    
    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete answers first (cascade should handle this, but being explicit)
    await db('qa_answers').where('question_id', id).del();
    
    // Delete question
    const deleted = await db('qa_questions').where('id', id).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

const getQAStats = async (req, res) => {
  try {
    const [totalQuestions, pendingQuestions, answeredQuestions, closedQuestions, totalAnswers] = await Promise.all([
      db('qa_questions').count('id as count').first(),
      db('qa_questions').where('status', 'pending').count('id as count').first(),
      db('qa_questions').where('status', 'answered').count('id as count').first(),
      db('qa_questions').where('status', 'closed').count('id as count').first(),
      db('qa_answers').count('id as count').first()
    ]);

    // Recent questions
    const recentQuestions = await db('qa_questions')
      .leftJoin('users', 'qa_questions.user_id', 'users.id')
      .select(
        'qa_questions.id',
        'qa_questions.question',
        'qa_questions.status',
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
        closedQuestions: closedQuestions.count,
        totalAnswers: totalAnswers.count
      },
      recentQuestions
    });
  } catch (error) {
    console.error('Error fetching Q&A stats:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A statistics' });
  }
};

module.exports = {
  submitQuestion,
  getQuestions,
  getQuestionById,
  submitAnswer,
  getLawyerQuestions,
  getAdminQuestions,
  updateQuestionStatus,
  deleteQuestion,
  getQAStats
};