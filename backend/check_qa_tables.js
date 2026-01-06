require('dotenv').config();
const db = require('./db');

async function checkQATablesStructure() {
  try {
    console.log('🔍 Checking QA tables structure...');
    
    // Check if qa_answers table exists
    const hasQAAnswersTable = await db.schema.hasTable('qa_answers');
    console.log(`📋 qa_answers table exists: ${hasQAAnswersTable}`);
    
    if (hasQAAnswersTable) {
      // Check columns in qa_answers table
      const columns = await db('qa_answers').columnInfo();
      console.log('📋 qa_answers columns:', Object.keys(columns));
      
      // Check if lawyer_id column exists
      if (!columns.lawyer_id) {
        console.log('❌ lawyer_id column missing! Adding it...');
        await db.schema.table('qa_answers', function(table) {
          table.integer('lawyer_id').unsigned().notNullable();
          table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
        });
        console.log('✅ Added lawyer_id column');
      } else {
        console.log('✅ lawyer_id column exists');
      }
    } else {
      console.log('❌ qa_answers table does not exist! Creating it...');
      await db.schema.createTable('qa_answers', function(table) {
        table.increments('id').primary();
        table.integer('question_id').unsigned().notNullable();
        table.integer('lawyer_id').unsigned().notNullable();
        table.text('answer').notNullable();
        table.boolean('is_best_answer').defaultTo(false);
        table.integer('likes').defaultTo(0);
        table.timestamps(true, true);
        
        table.foreign('question_id').references('id').inTable('qa_questions').onDelete('CASCADE');
        table.foreign('lawyer_id').references('id').inTable('lawyers').onDelete('CASCADE');
        table.index(['question_id', 'created_at']);
      });
      console.log('✅ Created qa_answers table');
    }
    
    // Check qa_questions table
    const hasQAQuestionsTable = await db.schema.hasTable('qa_questions');
    console.log(`📋 qa_questions table exists: ${hasQAQuestionsTable}`);
    
    if (hasQAQuestionsTable) {
      const questionColumns = await db('qa_questions').columnInfo();
      console.log('📋 qa_questions columns:', Object.keys(questionColumns));
    }
    
    // Test the query that was failing
    console.log('\n🧪 Testing the problematic query...');
    try {
      const testQuery = await db('qa_questions')
        .leftJoin('users', 'qa_questions.user_id', 'users.id')
        .select(
          'qa_questions.*',
          'users.name as user_display_name',
          db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id) as answer_count'),
          db.raw('(SELECT COUNT(*) FROM qa_answers WHERE qa_answers.question_id = qa_questions.id AND qa_answers.lawyer_id = 49) as my_answer_count')
        )
        .where('qa_questions.status', 'pending')
        .havingRaw('my_answer_count = 0')
        .orderBy('qa_questions.created_at', 'desc')
        .limit(10);
      
      console.log('✅ Query executed successfully');
      console.log(`📊 Found ${testQuery.length} questions`);
    } catch (error) {
      console.log('❌ Query still failing:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking QA tables:', error);
  } finally {
    process.exit(0);
  }
}

checkQATablesStructure();