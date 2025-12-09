const db = require('./db');

async function seedSampleForms() {
  try {
    console.log('🌱 Seeding sample legal forms...\n');

    const sampleForms = [
      {
        title: 'LLC Operating Agreement',
        slug: 'llc-operating-agreement-' + Date.now(),
        description: 'Comprehensive operating agreement for Limited Liability Companies',
        category: 'Business Law',
        category_id: 1,
        practice_area: 'Business Law',
        is_free: true,
        price: 0,
        created_by: 1,
        created_by_type: 'admin',
        status: 'approved'
      },
      {
        title: 'Non-Disclosure Agreement (NDA)',
        slug: 'nda-' + Date.now(),
        description: 'Protect confidential business information with this NDA template',
        category: 'Business Law',
        category_id: 1,
        practice_area: 'Business Law',
        is_free: true,
        price: 0,
        created_by: 1,
        created_by_type: 'admin',
        status: 'approved'
      },
      {
        title: 'Divorce Petition',
        slug: 'divorce-petition-' + Date.now(),
        description: 'Standard divorce petition form for uncontested divorces',
        category: 'Family Law',
        category_id: 2,
        practice_area: 'Family Law',
        is_free: false,
        price: 49.99,
        created_by: 1,
        created_by_type: 'admin',
        status: 'approved'
      },
      {
        title: 'Residential Lease Agreement',
        slug: 'residential-lease-' + Date.now(),
        description: 'Standard residential property lease agreement',
        category: 'Real Estate',
        category_id: 3,
        practice_area: 'Real Estate',
        is_free: true,
        price: 0,
        created_by: 1,
        created_by_type: 'admin',
        status: 'approved'
      },
      {
        title: 'Last Will and Testament',
        slug: 'will-testament-' + Date.now(),
        description: 'Create your last will and testament with this comprehensive template',
        category: 'Estate Planning',
        category_id: 4,
        practice_area: 'Estate Planning',
        is_free: false,
        price: 79.99,
        created_by: 1,
        created_by_type: 'admin',
        status: 'approved'
      }
    ];

    await db('legal_forms').insert(sampleForms);
    
    console.log('✅ Successfully seeded', sampleForms.length, 'sample forms');
    
    const count = await db('legal_forms').count('id as count').first();
    console.log('📊 Total forms in database:', count.count);
    
  } catch (error) {
    console.error('❌ Error seeding forms:', error.message);
  } finally {
    process.exit();
  }
}

seedSampleForms();
