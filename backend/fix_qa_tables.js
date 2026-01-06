require('dotenv').config();
const db = require('./db');

async function fixQATables() {
  try {
    console.log('🔧 Fixing QA tables structure...');
    
    // Drop existing tables to recreate with correct structure
    console.log('🗑️ Dropping existing QA tables...');
    await db.schema.dropTableIfExists('qa_answers');
    await db.schema.dropTableIfExists('qa_questions');
    
    // Create qa_questions table with correct structure
    console.log('📋 Creating qa_questions table...');
    await db.schema.createTable('qa_questions', function(table) {
      table.increments('id').primary();
      table.string('secure_id', 32).unique().notNullable();
      table.text('question').notNullable();
      table.text('situation').notNullable();
      table.string('city_state', 100).notNullable();
      table.enum('plan_hire_attorney', ['yes', 'not_sure', 'no']).notNullable();
      table.integer('user_id').unsigned().nullable();
      table.string('user_email', 255).nullable();
      table.string('user_name', 255).nullable();
      table.enum('status', ['pending', 'answered', 'closed']).defaultTo('pending');
      table.boolean('is_public').defaultTo(true);
      table.integer('views').defaultTo(0);
      table.integer('likes').defaultTo(0);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.index(['status', 'created_at']);
      table.index(['secure_id']);
    });
    
    // Create qa_answers table with correct structure
    console.log('📋 Creating qa_answers table...');
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
    
    console.log('✅ QA tables created successfully');
    
    // Insert some sample data for testing
    console.log('📝 Adding sample QA data...');
    
    const [questionId] = await db('qa_questions').insert({
      secure_id: 'sample123456789abcdef',
      question: 'What are my rights as a tenant?',
      situation: 'My landlord is trying to evict me without proper notice. I have been a good tenant for 2 years and always paid rent on time.',
      city_state: 'Seattle, WA',
      plan_hire_attorney: 'not_sure',
      user_email: 'tenant@example.com',
      user_name: 'John Tenant',
      status: 'pending',
      is_public: true,
      views: 5,
      likes: 2
    });
    
    console.log(`✅ Added sample question with ID: ${questionId}`);
    
    // Test the query that was failing
    console.log('🧪 Testing the fixed query...');
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
    
    console.log('✅ Query executed successfully!');
    console.log(`📊 Found ${testQuery.length} questions`);
    
    if (testQuery.length > 0) {
      console.log('📋 Sample question:', {
        id: testQuery[0].id,
        question: testQuery[0].question,
        status: testQuery[0].status,
        answer_count: testQuery[0].answer_count
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing QA tables:', error);
  } finally {
    process.exit(0);
  }
}

fixQATables();