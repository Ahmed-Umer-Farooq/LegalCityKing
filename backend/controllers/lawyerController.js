const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../utils/token');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');

// Real email sending using nodemailer
const mockSendVerificationEmail = sendVerificationEmail;
const mockSendResetPasswordEmail = sendResetPasswordEmail;

const { validateRegistration, validateLogin } = require('../utils/validator');

const registerLawyer = async (req, res) => {
  try {
    const { name, username, email, password, registration_id, law_firm, speciality, address, zip_code, city, state, country, mobile_number } = req.body;

    const validation = validateRegistration({ name, email, password, role: 'lawyer', registration_id });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    const existingLawyer = await db('lawyers').where({ email }).first();
    if (existingLawyer) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Check for existing username
    const existingUsername = await db('lawyers').where({ username }).first();
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check for existing registration ID
    const existingRegId = await db('lawyers').where({ registration_id }).first();
    if (existingRegId) {
      return res.status(400).json({ message: 'Registration ID already exists' });
    }
    // Cross-table uniqueness: prevent same email in users table
    const existingUserWithSameEmail = await db('users').where({ email }).first();
    if (existingUserWithSameEmail) {
      return res.status(400).json({ message: 'This email is already registered as a user. Please sign in as a user.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const secure_id = crypto.randomBytes(16).toString('hex');

    await db('lawyers').insert({
      secure_id,
      name,
      username,
      email,
      password: hashedPassword,
      registration_id,
      law_firm,
      speciality,
      address,
      zip_code,
      city,
      state,
      country,
      mobile_number,
      email_verified: 0,
      email_verification_code: verificationCode,
      is_verified: 0,
      lawyer_verified: 0,
    });

    await mockSendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Registration successful. Please check your email for verification code.' });
  } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginLawyer = async (req, res) => {
  try {
    const { email, password, registration_id } = req.body;

    const validation = validateLogin({ email, password, registration_id, role: 'lawyer' });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    // Require registration_id for lawyer login to avoid email-based role confusion
    if (!registration_id) {
      return res.status(400).json({ message: 'Registration ID is required to login as a lawyer.' });
    }
    let lawyer = await db('lawyers').where({ registration_id }).first();

    if (!lawyer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!lawyer.email_verified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Prevent cross-role login if email also exists in users table
    const userWithSameEmail = await db('users').where({ email: lawyer.email }).first();
    if (userWithSameEmail) {
      return res.status(400).json({ message: 'This email is already registered as a user. Please sign in as a user.' });
    }

    // If this lawyer was created with Google OAuth, password may be empty
    if (!lawyer.password || lawyer.password === '') {
      return res.status(400).json({ message: 'This account was created with Google. Please sign in with Google.' });
    }

    const isPasswordValid = await bcrypt.compare(password, lawyer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(lawyer);

    res.json({ token, user: { id: lawyer.id, name: lawyer.name, email: lawyer.email, role: 'lawyer' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const lawyer = await db('lawyers').where({ id: req.user.id }).select('id', 'name', 'username', 'email', 'registration_id', 'law_firm', 'speciality', 'address', 'zip_code', 'city', 'state', 'country', 'mobile_number').first();
    res.json(lawyer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, username, address, zip_code, city, state, country, mobile_number } = req.body;

    await db('lawyers').where({ id: req.user.id }).update({
      name,
      username,
      address,
      zip_code,
      city,
      state,
      country,
      mobile_number,
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await db('lawyers').where({ id: req.user.id }).del();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLawyersDirectory = async (req, res) => {
  try {
    const lawyers = await db('lawyers')
      .leftJoin('lawyer_reviews', 'lawyers.id', 'lawyer_reviews.lawyer_id')
      .select(
        'lawyers.id', 'lawyers.secure_id', 'lawyers.name', 'lawyers.email', 'lawyers.address', 
        'lawyers.rating', 'lawyers.experience', 'lawyers.speciality', 'lawyers.description', 
        'lawyers.profile_image', 'lawyers.registration_id', 'lawyers.law_firm', 
        'lawyers.is_verified', 'lawyers.lawyer_verified',
        db.raw('COUNT(lawyer_reviews.id) as total_reviews'),
        db.raw('AVG(lawyer_reviews.rating) as average_rating')
      )
      .where('lawyers.is_verified', 1)
      .groupBy('lawyers.id');

    const processedLawyers = lawyers.map(lawyer => {
      const totalReviews = parseInt(lawyer.total_reviews) || 0;
      const averageRating = lawyer.average_rating ? parseFloat(lawyer.average_rating).toFixed(1) : '0.0';
      const yearsLicensed = parseInt(lawyer.experience?.replace(/\D/g, '')) || 10;
      
      return {
        id: lawyer.secure_id,
        name: lawyer.name,
        email: lawyer.email,
        location: lawyer.address,
        address: lawyer.address,
        rating: parseFloat(averageRating),
        reviewCount: totalReviews,
        reviews: totalReviews,
        reviews_count: totalReviews,
        reviewScore: parseFloat(averageRating),
        yearsLicensed: yearsLicensed,
        practiceAreas: lawyer.speciality ? [lawyer.speciality] : ['General Practice'],
        practice_areas: lawyer.speciality || 'General Practice',
        description: lawyer.description || 'Experienced attorney providing quality legal services.',
        bio: lawyer.description || 'Experienced attorney providing quality legal services.',
        imageUrl: lawyer.profile_image || 'https://via.placeholder.com/150',
        profile_picture: lawyer.profile_image || 'https://via.placeholder.com/150',
        category: lawyer.speciality || 'General Practice',
        registration_id: lawyer.registration_id,
        law_firm: lawyer.law_firm,
        speciality: lawyer.speciality,
        verified: lawyer.is_verified === 1,
        lawyer_verified: lawyer.lawyer_verified === 1
      };
    });

    res.json(processedLawyers);
  } catch (error) {
    console.error('Error fetching lawyers directory:', error);
    res.status(500).json({ message: 'Server error while fetching lawyers directory' });
  }
};

const getLawyerById = async (req, res) => {
  try {
    const { secureId } = req.params;
    const lawyer = await db('lawyers')
      .select(
        'id', 'secure_id', 'name', 'email', 'address', 'rating', 'experience', 'speciality',
        'description', 'profile_image', 'registration_id', 'law_firm',
        'mobile_number', 'city', 'state', 'zip_code', 'country',
        'subscription_tier', 'subscription_status', 'subscription_created_at'
      )
      .where('secure_id', secureId)
      .where('is_verified', 1)
      .first();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Get real review data
    const reviewStats = await db('lawyer_reviews')
      .where('lawyer_id', lawyer.id)
      .select(
        db.raw('COUNT(*) as total_reviews'),
        db.raw('AVG(rating) as average_rating')
      )
      .first();

    const totalReviews = parseInt(reviewStats.total_reviews) || 0;
    const averageRating = reviewStats.average_rating ? parseFloat(reviewStats.average_rating).toFixed(1) : '0.0';
    const yearsLicensed = parseInt(lawyer.experience?.replace(/\D/g, '')) || 10;

    const processedLawyer = {
      id: lawyer.secure_id,
      name: lawyer.name,
      email: lawyer.email,
      location: lawyer.address,
      rating: parseFloat(averageRating),
      reviews: totalReviews,
      reviewCount: totalReviews,
      yearsLicensed: yearsLicensed,
      practiceAreas: lawyer.speciality ? [lawyer.speciality] : ['General Practice'],
      description: lawyer.description || 'Experienced attorney providing quality legal services.',
      imageUrl: lawyer.profile_image || 'https://via.placeholder.com/150',
      registration_id: lawyer.registration_id,
      law_firm: lawyer.law_firm,
      speciality: lawyer.speciality,
      mobile_number: lawyer.mobile_number,
      address: lawyer.address,
      city: lawyer.city,
      state: lawyer.state,
      zip_code: lawyer.zip_code,
      country: lawyer.country,
      subscription_tier: lawyer.subscription_tier,
      subscription_status: lawyer.subscription_status,
      subscription_created_at: lawyer.subscription_created_at
    };

    res.json(processedLawyer);
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    res.status(500).json({ message: 'Server error while fetching lawyer' });
  }
};

const sendMessageToLawyer = async (req, res) => {
  try {
    const { secureId } = req.params;
    const { name, email, phone, maritalStatus, children, message, phonePreference, preferredTime } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Check if lawyer exists and get the actual database ID
    const lawyer = await db('lawyers').where('secure_id', secureId).where('is_verified', 1).first();
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Create messages table if it doesn't exist
    const hasMessagesTable = await db.schema.hasTable('messages');
    if (!hasMessagesTable) {
      await db.schema.createTable('messages', function(table) {
        table.increments('id').primary();
        table.integer('lawyer_id').unsigned().references('id').inTable('lawyers');
        table.string('name');
        table.string('email');
        table.string('phone');
        table.string('maritalStatus');
        table.string('children');
        table.text('message');
        table.string('phonePreference');
        table.string('preferredTime');
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
    }

    // Insert message using the actual database ID
    await db('messages').insert({
      lawyer_id: lawyer.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone || null,
      maritalStatus: maritalStatus || null,
      children: children || null,
      message: message.trim(),
      phonePreference: phonePreference || null,
      preferredTime: preferredTime || null
    });

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

module.exports = {
  registerLawyer,
  loginLawyer,
  getProfile,
  updateProfile,
  deleteAccount,
  getLawyersDirectory,
  getLawyerById,
  sendMessageToLawyer,
};
