const db = require('../db');

const createReview = async (req, res) => {
  try {
    const { lawyer_secure_id, rating, review } = req.body;
    const user_id = req.user.id;

    if (!lawyer_secure_id || !rating) {
      return res.status(400).json({ message: 'Lawyer ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const lawyer = await db('lawyers').where('secure_id', lawyer_secure_id).first();
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const existingReview = await db('lawyer_reviews')
      .where({ lawyer_id: lawyer.id, user_id })
      .first();

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this lawyer' });
    }

    await db('lawyer_reviews').insert({
      lawyer_id: lawyer.id,
      user_id,
      rating,
      review: review || null
    });

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

const getReviews = async (req, res) => {
  try {
    const { lawyer_secure_id } = req.params;

    const lawyer = await db('lawyers').where('secure_id', lawyer_secure_id).first();
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const reviews = await db('lawyer_reviews')
      .join('users', 'lawyer_reviews.user_id', 'users.id')
      .where('lawyer_reviews.lawyer_id', lawyer.id)
      .select(
        'lawyer_reviews.id',
        'lawyer_reviews.rating',
        'lawyer_reviews.review',
        'lawyer_reviews.created_at',
        'users.name as user_name'
      )
      .orderBy('lawyer_reviews.created_at', 'desc');

    const avgRating = await db('lawyer_reviews')
      .where('lawyer_id', lawyer.id)
      .avg('rating as average')
      .first();

    const average = avgRating.average ? parseFloat(avgRating.average).toFixed(1) : '0';

    res.json({
      reviews,
      average_rating: average,
      total_reviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

const createEndorsement = async (req, res) => {
  try {
    const { endorsed_lawyer_secure_id, endorsement_text, relationship } = req.body;
    const endorser_id = req.user.id;

    if (!endorsed_lawyer_secure_id || !endorsement_text || !relationship) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const endorsedLawyer = await db('lawyers').where('secure_id', endorsed_lawyer_secure_id).first();
    if (!endorsedLawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    if (endorser_id === endorsedLawyer.id) {
      return res.status(400).json({ message: 'You cannot endorse yourself' });
    }

    const existingEndorsement = await db('lawyer_endorsements')
      .where({ endorser_lawyer_id: endorser_id, endorsed_lawyer_id: endorsedLawyer.id })
      .first();

    if (existingEndorsement) {
      return res.status(400).json({ message: 'You have already endorsed this lawyer' });
    }

    await db('lawyer_endorsements').insert({
      endorser_lawyer_id: endorser_id,
      endorsed_lawyer_id: endorsedLawyer.id,
      endorsement_text,
      relationship
    });

    res.status(201).json({ message: 'Endorsement submitted successfully' });
  } catch (error) {
    console.error('Error creating endorsement:', error);
    res.status(500).json({ message: 'Failed to submit endorsement' });
  }
};

const getEndorsements = async (req, res) => {
  try {
    const { lawyer_secure_id } = req.params;

    const lawyer = await db('lawyers').where('secure_id', lawyer_secure_id).first();
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const endorsements = await db('lawyer_endorsements')
      .join('lawyers', 'lawyer_endorsements.endorser_lawyer_id', 'lawyers.id')
      .where('lawyer_endorsements.endorsed_lawyer_id', lawyer.id)
      .select(
        'lawyer_endorsements.id',
        'lawyer_endorsements.endorsement_text',
        'lawyer_endorsements.relationship',
        'lawyer_endorsements.created_at',
        'lawyers.name as endorser_name',
        'lawyers.speciality as endorser_speciality'
      )
      .orderBy('lawyer_endorsements.created_at', 'desc');

    res.json({
      endorsements,
      total_endorsements: endorsements.length
    });
  } catch (error) {
    console.error('Error fetching endorsements:', error);
    res.status(500).json({ message: 'Failed to fetch endorsements' });
  }
};

module.exports = {
  createReview,
  getReviews,
  createEndorsement,
  getEndorsements
};
