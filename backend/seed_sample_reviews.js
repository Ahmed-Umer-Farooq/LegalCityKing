const db = require('./db');

async function seedSampleReviews() {
  try {
    console.log('🌱 Seeding sample reviews...');

    // Get some lawyers and users
    const lawyers = await db('lawyers').select('id', 'name').limit(5);
    const users = await db('users').select('id', 'name').limit(10);

    if (lawyers.length === 0) {
      console.log('❌ No lawyers found. Please ensure lawyers exist first.');
      return;
    }

    if (users.length === 0) {
      console.log('❌ No users found. Please ensure users exist first.');
      return;
    }

    // Sample reviews data
    const sampleReviews = [
      { rating: 5, review: "Excellent lawyer! Very professional and got great results for my case." },
      { rating: 4, review: "Good communication and knowledgeable. Would recommend." },
      { rating: 5, review: "Outstanding service. Handled my divorce case with care and expertise." },
      { rating: 4, review: "Professional and responsive. Happy with the outcome." },
      { rating: 5, review: "Best lawyer I've worked with. Highly recommend!" },
      { rating: 3, review: "Good lawyer but communication could be better." },
      { rating: 4, review: "Knowledgeable and experienced. Fair pricing." },
      { rating: 5, review: "Exceptional legal representation. Worth every penny." },
      { rating: 4, review: "Very helpful and professional throughout the process." },
      { rating: 5, review: "Amazing results! Could not be happier with the service." }
    ];

    // Clear existing reviews
    await db('lawyer_reviews').del();
    console.log('🗑️ Cleared existing reviews');

    // Add reviews for each lawyer
    for (const lawyer of lawyers) {
      const numReviews = Math.floor(Math.random() * 8) + 3; // 3-10 reviews per lawyer
      console.log(`📝 Adding ${numReviews} reviews for ${lawyer.name}`);

      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomReview = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];

        // Check if this user already reviewed this lawyer
        const existingReview = await db('lawyer_reviews')
          .where({ lawyer_id: lawyer.id, user_id: randomUser.id })
          .first();

        if (!existingReview) {
          await db('lawyer_reviews').insert({
            lawyer_id: lawyer.id,
            user_id: randomUser.id,
            rating: randomReview.rating,
            review: randomReview.review,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          });
        }
      }
    }

    // Show results
    const reviewStats = await db('lawyer_reviews')
      .join('lawyers', 'lawyer_reviews.lawyer_id', 'lawyers.id')
      .select(
        'lawyers.name',
        db.raw('COUNT(lawyer_reviews.id) as total_reviews'),
        db.raw('AVG(lawyer_reviews.rating) as average_rating')
      )
      .groupBy('lawyers.id', 'lawyers.name');

    console.log('\n📊 Review Statistics:');
    reviewStats.forEach(stat => {
      const avgRating = parseFloat(stat.average_rating).toFixed(1);
      console.log(`${stat.name}: ${avgRating} ⭐ (${stat.total_reviews} reviews)`);
    });

    console.log('\n✅ Sample reviews seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
}

seedSampleReviews();