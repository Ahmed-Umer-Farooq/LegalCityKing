const db = require('./db');

async function verifySetup() {
  console.log('🔍 Verifying Legal Forms System Setup...\n');

  try {
    // Check tables exist
    console.log('1️⃣ Checking database tables...');
    const tables = await db.raw("SHOW TABLES LIKE '%form%'");
    console.log('   ✅ Found tables:', tables[0].map(t => Object.values(t)[0]).join(', '));

    // Check categories
    console.log('\n2️⃣ Checking form categories...');
    const categories = await db('form_categories').select('*');
    console.log(`   ✅ Found ${categories.length} categories`);
    categories.forEach(cat => console.log(`      - ${cat.name} (${cat.slug})`));

    // Check forms
    console.log('\n3️⃣ Checking legal forms...');
    const forms = await db('legal_forms').select('*');
    console.log(`   ✅ Found ${forms.length} forms`);
    
    const pending = forms.filter(f => f.status === 'pending').length;
    const approved = forms.filter(f => f.status === 'approved').length;
    const rejected = forms.filter(f => f.status === 'rejected').length;
    
    console.log(`      - Pending: ${pending}`);
    console.log(`      - Approved: ${approved}`);
    console.log(`      - Rejected: ${rejected}`);

    // Show sample forms
    if (forms.length > 0) {
      console.log('\n   📋 Sample forms:');
      forms.slice(0, 3).forEach(form => {
        console.log(`      - ${form.title} (${form.status}) - ${form.is_free ? 'Free' : '$' + form.price}`);
      });
    }

    // Check uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads', 'forms');
    
    console.log('\n4️⃣ Checking uploads directory...');
    if (fs.existsSync(uploadsDir)) {
      console.log('   ✅ uploads/forms directory exists');
    } else {
      console.log('   ⚠️  Creating uploads/forms directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('   ✅ Directory created');
    }

    console.log('\n✅ Setup verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start backend: npm start');
    console.log('   2. Start frontend: cd ../Frontend && npm start');
    console.log('   3. Follow FORMS_TEST_WORKFLOW.md for testing');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

verifySetup();
