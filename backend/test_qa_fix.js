const db = require('./db');

async function testQAFix() {
  try {
    console.log('=== TESTING Q&A FIX ===\n');
    
    const lawyer_id = 47;
    const status = 'pending';
    
    console.log('Testing getLawyerQuestions query for lawyer_id:', lawyer_id);
    
    // Test the corrected query
    const totalCount = await db('qa_questions')
      .leftJoin('qa_answers', function() {
        this.on('qa_questions.id', '=', 'qa_answers.question_id')
            .andOn('qa_answers.lawyer_id', '=', db.raw('?', [lawyer_id]));
      })
      .where('qa_questions.status', status)
      .whereNull('qa_answers.id')
      .count('qa_questions.id as count')
      .first();
    
    console.log('✅ Query executed successfully');
    console.log('Total unanswered questions for lawyer:', totalCount.count);
    
    // Test the main questions query
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
      .limit(10);
    
    console.log('✅ Main questions query executed successfully');
    console.log('Questions available for lawyer to answer:', questions.length);
    
    questions.forEach((q, index) => {
      console.log(`  ${index + 1}. "${q.question}" (ID: ${q.id})`);
    });
    
    console.log('\n=== Q&A FIX TEST COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testQAFix();