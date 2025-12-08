const db = require('./db');

async function testReviewSystem() {
  try {
    console.log('🔍 Testing Review and Endorsement System...\n');

    // Check if tables exist
    const reviewTableExists = await db.schema.hasTable('lawyer_reviews');
    const endorsementTableExists = await db.schema.hasTable('lawyer_endorsements');
    
    console.log('✅ lawyer_reviews table exists:', reviewTableExists);
    console.log('✅ lawyer_endorsements table exists:', endorsementTableExists);
    
    // Get sample data
    const reviewCount = await db('lawyer_reviews').count('id as count').first();
    const endorsementCount = await db('lawyer_endorsements').count('id as count').first();
    
    console.log('\n📊 Current Data:');
    console.log('   Reviews:', reviewCount.count);
    console.log('   Endorsements:', endorsementCount.count);
    
    // Get a sample lawyer
    const lawyer = await db('lawyers').where('is_verified', 1).first();
    if (lawyer) {
      console.log('\n👨‍⚖️ Sample Lawyer:', lawyer.name, '(ID:', lawyer.secure_id, ')');
    }
    
    // Get a sample user
    const user = await db('users').first();
    if (user) {
      console.log('👤 Sample User:', user.name, '(ID:', user.id, ')');
    }
    
    console.log('\n✅ Review and Endorsement System is ready!');
    console.log('\n📝 API Endpoints:');
    console.log('   POST /api/reviews - Create review (requires user authentication)');
    console.log('   GET  /api/reviews/:lawyer_secure_id - Get reviews');
    console.log('   POST /api/endorsements - Create endorsement (requires lawyer authentication)');
    console.log('   GET  /api/endorsements/:lawyer_secure_id - Get endorsements');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testReviewSystem();
