const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../utils/token');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');

// Real email sending using nodemailer
const mockSendVerificationEmail = sendVerificationEmail;
const mockSendResetPasswordEmail = sendResetPasswordEmail;

const { validateRegistration, validateLogin } = require('../utils/validator');

const registerUser = async (req, res) => {
  try {
    // Accept both snake_case and camelCase from frontend
    const {
      name,
      username,
      email,
      password,
      address,
      zip_code: zip_code_body,
      zipCode,
      city,
      state,
      country,
      mobile_number: mobile_number_body,
      mobileNumber,
      referral_code,
      ref
    } = req.body;

    const zip_code = zip_code_body || zipCode || null;
    const mobile_number = mobile_number_body || mobileNumber || null;
    const referred_by = referral_code || ref || null;

    // Lightweight request log (avoid logging password)
    console.log('Register request received:', { email, name, username });

    const validation = validateRegistration({ name, email, password, role: 'user' });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    // Cross-table uniqueness: prevent same email in lawyers table
    const existingLawyerWithSameEmail = await db('lawyers').where({ email }).first();
    if (existingLawyerWithSameEmail) {
      return res.status(400).json({ message: 'This email is already registered as a lawyer. Please sign in as a lawyer.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const secure_id = crypto.randomBytes(16).toString('hex');
    
    // Generate referral code for new user
    const generateReferralCode = (name) => {
      const prefix = name.substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${random}`;
    };
    const user_referral_code = generateReferralCode(name);

    const [userId] = await db('users').insert({
      secure_id,
      name,
      username,
      email,
      password: hashedPassword,
      address,
      zip_code,
      city,
      state,
      country,
      mobile_number,
      email_verified: 0,
      email_verification_code: verificationCode,
      is_verified: 0,
      referral_code: user_referral_code,
      referred_by
    });
    
    // Create referral record if referred by someone
    if (referred_by) {
      const referrer = await db('users').where('referral_code', referred_by).first();
      if (referrer) {
        await db('referrals').insert({
          referrer_id: referrer.id,
          referee_id: userId,
          referral_code: referred_by,
          status: 'pending'
        });
      }
    }

    await mockSendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Registration successful. Please check your email for verification code.' });
  } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = validateLogin({ email, password, role: 'user' });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
    }

    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'user' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('id', 'name', 'username', 'email', 'address', 'zip_code', 'city', 'state', 'country', 'mobile_number').first();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, username, address, zip_code, city, state, country, mobile_number } = req.body;

    await db('users').where({ id: req.user.id }).update({
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
    await db('users').where({ id: req.user.id }).del();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  deleteAccount,
};
